# `dependencies.test.ts`

**DO NOT MODIFY**. This file has been autogenerated. Run `rome test internal/codec-js-manifest/normalize/dependencies.test.ts --update-snapshots` to update.

## `can parse gist patterns`

```javascript
gist {id: "123456"}
```

## `can parse npm dependency patterns`

### `0`

```javascript
npm {
	name: {packageName: "foo"}
}
```

### `1`

```javascript
npm {
	name: {packageName: "@foo/bar"}
}
```

### `2`

```javascript
npm {
	name: {packageName: "foo"}
	range: AbsoluteVersion {
		build: []
		major: 1
		minor: 0
		patch: 0
		prerelease: []
		loc: SourceLocation unknown 1:0-1:4
	}
}
```

### `3`

```javascript
npm {
	name: {packageName: "@foo/bar"}
	range: AbsoluteVersion {
		build: []
		major: 1
		minor: 0
		patch: 0
		prerelease: []
		loc: SourceLocation unknown 1:0-1:4
	}
}
```

## `can parse workspace patterns`

```javascript
workspace {path: "*"}
```