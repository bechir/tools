# `index.test.ts`

**DO NOT MODIFY**. This file has been autogenerated. Run `rome test internal/css-parser/index.test.ts --update-snapshots` to update.

## `invalid > font`

```javascript
CSSRoot {
	body: [
		CSSAtRule {
			name: "font-face"
			prelude: []
			loc: SourceLocation invalid/font/input.css 1:0-3:1
		}
	]
	comments: []
	corrupt: false
	diagnostics: [
		{
			origins: [{entity: "ParserCore<css>"}]
			description: {
				advice: []
				category: ["parse"]
				categoryValue: "css"
				message: RAW_MARKUP {value: "The rule <emphasis>@font-face</emphasis> needs the property <emphasis>src</emphasis> in order to be valid."}
			}
			location: {
				language: "css"
				path: RelativePath<invalid/font/input.css>
				end: Position 1:10
				start: Position 1:0
			}
		}
	]
	path: RelativePath<invalid/font/input.css>
	loc: SourceLocation invalid/font/input.css 1:0-3:1
}
```
