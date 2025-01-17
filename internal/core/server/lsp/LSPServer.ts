/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Consumer} from "@internal/consume";
import Server from "../Server";
import ServerClient from "../ServerClient";
import {
	AbsoluteFilePath,
	AbsoluteFilePathMap,
	AbsoluteFilePathSet,
	createAbsoluteFilePath,
} from "@internal/path";
import {
	DIAGNOSTIC_CATEGORIES,
	Diagnostic,
	DiagnosticsProcessor,
	catchDiagnostics,
	formatCategoryDescription,
	getActionAdviceFromDiagnostic,
} from "@internal/diagnostics";
import {
	PartialServerQueryRequest,
	ServerQueryResponse,
} from "@internal/core/common/bridges/ServerBridge";
import Checker from "../checker/Checker";
import ServerRequest, {EMPTY_SUCCESS_RESPONSE} from "../ServerRequest";
import {DEFAULT_CLIENT_REQUEST_FLAGS} from "@internal/core/common/types/client";
import {JSONPropertyValue} from "@internal/codec-config";
import {
	ReporterProgress,
	ReporterProgressOptions,
} from "@internal/cli-reporter";
import {LSPTransport} from "./protocol";
import LSPProgress from "./LSPProgress";
import {
	convertDiagnosticLocationToLSPRange,
	convertDiagnosticsToLSP,
	diffTextEdits,
	doRangesOverlap,
	getDecisionFromAdviceAction,
	getLSPRange,
	getPathFromTextDocument,
	getWorkerBufferPatches,
} from "./utils";
import {markup, readMarkup} from "@internal/markup";
import {LSPCodeAction} from "./types";
import {Event} from "@internal/events";
import {CommandName} from "@internal/core/common/commands";
import {markupToPlainText} from "@internal/cli-layout";

type LSPProjectSession = {
	request: ServerRequest;
};

export default class LSPServer {
	constructor(request: ServerRequest) {
		this.request = request;
		this.server = request.server;
		this.client = request.client;

		this.lintSessionsPending = new AbsoluteFilePathSet();
		this.projectSessions = new AbsoluteFilePathMap();
		this.fileBuffers = new AbsoluteFilePathSet();
		this.fileVersions = new AbsoluteFilePathMap();

		this.watchProjectEvent = new Event("LSPServer.watchProject");

		request.endEvent.subscribe(async () => {
			await this.shutdown();
		});

		const transport = new LSPTransport(this.server.logger);
		this.transport = transport;

		transport.notificationEvent.subscribe(({method, params}) => {
			return this.handleNotification(method, params);
		});

		transport.requestEvent.subscribe(({method, params}) => {
			return this.handleRequest(method, params);
		});

		transport.errorEvent.subscribe((err) => {
			request.server.fatalErrorHandler.handle(err);
		});

		this.diagnosticsProcessor = this.createDiagnosticsProcessor();
	}

	public transport: LSPTransport;

	private request: ServerRequest;
	private client: ServerClient;
	private server: Server;

	private fileBuffers: AbsoluteFilePathSet;
	private fileVersions: AbsoluteFilePathMap<number>;
	private lintSessionsPending: AbsoluteFilePathSet;
	private projectSessions: AbsoluteFilePathMap<LSPProjectSession>;
	private diagnosticsProcessor: DiagnosticsProcessor;

	public watchProjectEvent: Event<AbsoluteFilePath, void>;

	private createDiagnosticsProcessor(): DiagnosticsProcessor {
		// We want to filter pendingFixes because we'll autoformat the file on save if necessary and it's just noise
		const processor = this.request.createDiagnosticsProcessor({
			filter: undefined,
		});
		processor.addEliminationFilter({
			category: DIAGNOSTIC_CATEGORIES["lint/pendingFixes"],
		});
		return processor;
	}

	private logMessage(path: AbsoluteFilePath, message: string) {
		this.server.logger.info(markup`[LSPServer] ${message}`);
		this.transport.write({
			jsonrpc: "2.0",
			method: "window/logMessage",
			params: {
				type: 4,
				uri: `file://${path.join()}`,
				message,
			},
		});
	}

	private logDiagnostics(path: AbsoluteFilePath, diagnostics: Diagnostic[] = []) {
		if (diagnostics.length === 0) {
			return;
		}

		const lines: string[] = [];
		const date = new Date();

		lines.push(`[Diagnostics - ${date.toTimeString()}] ${path.join()}`);
		for (const diag of diagnostics) {
			lines.push(
				`  (${formatCategoryDescription(diag.description)}) ${readMarkup(
					diag.description.message,
				)}`,
			);
		}
		this.logMessage(path, lines.join("\n"));
	}

	private createFakeServerRequest(
		commandName: CommandName,
		args: string[] = [],
	): ServerRequest {
		return new ServerRequest({
			client: this.client,
			server: this.server,
			query: {
				requestFlags: DEFAULT_CLIENT_REQUEST_FLAGS,
				commandFlags: {},
				args,
				commandName,
				silent: true,
				noData: false,
				noFileWrites: false,
			},
		});
	}

	private unwatchProject(path: AbsoluteFilePath) {
		// TODO maybe unset all buffers?
		const session = this.projectSessions.get(path);
		if (session !== undefined) {
			this.server.fatalErrorHandler.wrapPromise(
				session.request.teardown(EMPTY_SUCCESS_RESPONSE),
			);
			this.projectSessions.delete(path);
		}
	}

	public createProgress(opts?: ReporterProgressOptions): ReporterProgress {
		return new LSPProgress(this.transport, this.request.reporter, opts);
	}

	private async initProject(path: AbsoluteFilePath) {
		if (this.projectSessions.has(path) || this.lintSessionsPending.has(path)) {
			return;
		}

		this.lintSessionsPending.add(path);

		const project = await this.server.projectManager.findProject(path);

		if (project === undefined) {
			// Not a Rome project
			this.lintSessionsPending.delete(path);
			return;
		}

		const req = this.createFakeServerRequest("noop", [path.join()]);
		await req.init();

		// This is not awaited so it doesn't delay the initialize response
		this.server.fatalErrorHandler.wrapPromise(this.watchProject(path, req));
	}

	private async watchProject(path: AbsoluteFilePath, req: ServerRequest) {
		const checker = new Checker(
			req,
			{
				apply: false,
				hasDecisions: false,
				formatOnly: false,
				suppressionExplanation: "suppressed via editor",
			},
		);

		const runner = await checker.createRunner({
			onRunStart: () => {},
			createProgress: () => {
				return this.createProgress();
			},
			onChange: ({path, diagnostics}) => {
				if (!path.isAbsolute()) {
					// Can only display absolute path diagnostics
					return;
				}

				this.diagnosticsProcessor.removePath(path);
				this.diagnosticsProcessor.addDiagnostics(diagnostics);

				this.transport.write({
					method: "textDocument/publishDiagnostics",
					params: {
						uri: `file://${path.join()}`,
						diagnostics: convertDiagnosticsToLSP(
							this.diagnosticsProcessor.getDiagnosticsForPath(path),
							this.server,
						),
					},
				});
			},
			onRunEnd: ({}) => {},
		});

		req.resources.add(await checker.watch(runner));

		this.projectSessions.set(
			path,
			{
				request: req,
			},
		);
		this.lintSessionsPending.delete(path);

		const date = new Date();
		this.logMessage(path, `Watching ${path.join()} at ${date.toTimeString()}`);
		this.watchProjectEvent.send(path);
	}

	private async shutdown() {
		// Unwatch projects
		for (const path of this.projectSessions.keys()) {
			this.unwatchProject(path);
		}
		this.projectSessions.clear();

		// Clear set buffers
		for (const path of this.fileBuffers) {
			await this.request.requestWorkerClearBuffer(path);
		}
		this.fileBuffers.clear();
	}

	public async sendClientRequest(
		req: PartialServerQueryRequest,
	): Promise<ServerQueryResponse> {
		return this.client.handleRequest({
			silent: true,
			...req,
		});
	}

	private async handleRequest(
		method: string,
		params: Consumer,
	): Promise<JSONPropertyValue> {
		switch (method) {
			case "initialize": {
				const rootUri = params.get("rootUri");
				if (rootUri.exists()) {
					await this.initProject(createAbsoluteFilePath(rootUri.asString()));
				}

				const workspaceDirectories = params.get("workspaceDirectories");
				if (workspaceDirectories.exists()) {
					for (const elem of workspaceDirectories.asIterable()) {
						await this.initProject(getPathFromTextDocument(elem));
					}
				}

				return {
					capabilities: {
						textDocumentSync: {
							openClose: true,
							// This sends over incremental patches on change
							change: 2,
						},
						documentFormattingProvider: true,
						codeActionProvider: true,
						executeCommandProvider: {
							commands: ["rome.check.decisions", "rome.check.apply"],
						},
						workspaceDirectories: {
							supported: true,
							changeNotifications: true,
						},
					},
					serverInfo: {
						name: "rome",
					},
				};
			}

			case "textDocument/codeAction": {
				const path = getPathFromTextDocument(params.get("textDocument"));
				const codeActionRange = getLSPRange(params.get("range"));

				const codeActions: LSPCodeAction[] = [];
				const seenDecisions = new Set<string>();

				const diagnostics = this.diagnosticsProcessor.getDiagnosticsForPath(
					path,
				);
				if (diagnostics.length === 0) {
					return codeActions;
				}

				for (const diag of diagnostics) {
					const diagRange = convertDiagnosticLocationToLSPRange(diag.location);

					if (!doRangesOverlap(diagRange, codeActionRange)) {
						continue;
					}
					for (const item of getActionAdviceFromDiagnostic(diag)) {
						if (item.secondary) {
							continue;
						}

						const decision = getDecisionFromAdviceAction(item);
						if (decision === undefined || seenDecisions.has(decision)) {
							continue;
						}
						seenDecisions.add(decision);

						codeActions.push({
							title: `${markupToPlainText(item.description)}: ${formatCategoryDescription(
								diag.description,
							)}`,
							command: {
								title: "Rome: Check",
								command: "rome.check.decisions",
								arguments: [path.join(), decision],
							},
						});
					}
				}

				codeActions.push({
					title: "Rome: Fix All",
					kind: "source.fixAll.rome",
					command: {
						title: "Rome: Fix All",
						command: "rome.check.apply",
						arguments: [path.join()],
					},
				});

				return codeActions;
			}

			case "workspace/executeCommand": {
				const command = params.get("command").asString();
				const filename = params.get("arguments").getIndex(0).asString();

				const path = createAbsoluteFilePath(filename);
				const startVersion = this.fileVersions.get(path);

				let req: PartialServerQueryRequest | undefined;

				if (command === "rome.check.apply") {
					req = {
						commandName: "check",
						args: [filename],
						commandFlags: {apply: true},
						noFileWrites: true,
					};
				}

				if (command === "rome.check.decisions") {
					const decisions = params.get("arguments").getIndex(1).asString();
					req = {
						commandName: "check",
						args: [filename],
						commandFlags: {decisions},
						noFileWrites: true,
					};
				}

				if (req === undefined) {
					return null;
				}

				const response = await this.sendClientRequest(req);

				if (response.type === "SUCCESS" || response.type === "DIAGNOSTICS") {
					const original = await this.request.requestWorkerGetBuffer(path);
					const saveFile = response.files[filename];
					if (original === undefined || saveFile === undefined) {
						return null;
					}
					const endVersion = this.fileVersions.get(path);
					if (startVersion !== endVersion) {
						this.logMessage(
							path,
							`Can't update ${filename} because it was modified,`,
						);
						return null;
					}

					const edits = diffTextEdits(original, saveFile.content);

					await this.transport.request({
						jsonrpc: "2.0",
						method: "workspace/applyEdit",
						params: {
							label: "Rome Action",
							edit: {
								documentChanges: [
									{
										textDocument: {
											uri: `file://${filename}`,
											version: endVersion,
										},
										edits,
									},
								],
							},
						},
					});
				}

				return null;
			}

			case "textDocument/formatting": {
				const path = getPathFromTextDocument(params.get("textDocument"));

				const project = this.server.projectManager.findLoadedProject(path);
				if (project === undefined) {
					// Not in a Rome project
					return null;
				}

				const {value, diagnostics} = await catchDiagnostics(async () => {
					return this.request.requestWorkerFormat(path, {}, {});
				});

				this.logDiagnostics(path, diagnostics);

				if (value === undefined) {
					// Not a file we support formatting or has diagnostics
					return null;
				}

				return diffTextEdits(value.original, value.formatted);
			}

			case "shutdown": {
				await this.shutdown();
				break;
			}
		}

		return null;
	}

	private async handleNotification(
		method: string,
		params: Consumer,
	): Promise<void> {
		switch (method) {
			case "workspace/didChangeWorkspaceDirectories": {
				for (const elem of params.get("added").asIterable()) {
					await this.initProject(getPathFromTextDocument(elem));
				}
				for (const elem of params.get("removed").asIterable()) {
					this.unwatchProject(getPathFromTextDocument(elem));
				}
				break;
			}

			case "textDocument/didOpen": {
				const textDocument = params.get("textDocument");
				const path = getPathFromTextDocument(textDocument);
				const project = this.server.projectManager.findLoadedProject(path);
				if (project === undefined) {
					return;
				}
				this.fileVersions.set(path, textDocument.get("version").asNumber());
				const content = textDocument.get("text").asString();
				await this.request.requestWorkerUpdateBuffer(path, content);
				this.fileBuffers.add(path);
				this.logMessage(path, `Opened: ${path.join()}`);
				break;
			}

			case "textDocument/didChange": {
				const textDocument = params.get("textDocument");
				const path = getPathFromTextDocument(textDocument);
				if (!this.fileBuffers.has(path)) {
					return;
				}
				this.fileVersions.set(path, textDocument.get("version").asNumber());
				const contentChanges = params.get("contentChanges");

				if (contentChanges.getIndex(0).has("range")) {
					const patches = getWorkerBufferPatches(contentChanges);
					await this.request.requestWorkerPatchBuffer(path, patches);
				} else {
					const content = contentChanges.getIndex(0).get("text").asString();
					await this.request.requestWorkerUpdateBuffer(path, content);
				}
				break;
			}

			case "textDocument/didClose": {
				const path = getPathFromTextDocument(params.get("textDocument"));
				if (!this.fileBuffers.has(path)) {
					return;
				}
				this.fileBuffers.delete(path);
				this.fileVersions.delete(path);
				await this.request.requestWorkerClearBuffer(path);
				this.logMessage(path, `Closed: ${path.join()}`);
				break;
			}
		}
	}
}
