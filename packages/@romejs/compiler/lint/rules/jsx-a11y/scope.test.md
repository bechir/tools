# `scope.test.ts`

**DO NOT MODIFY**. This file has been autogenerated. Run `rome test packages/@romejs/compiler/lint/rules/jsx-a11y/scope.test.ts --update-snapshots` to update.

## `disallow the scope prop on elements other than th`

### `0`

```

 unknown:1 lint/jsx-a11y/scope ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✖ The scope prop can only be used on th elements.

    <div scope={scope} />
    ^^^^^^^^^^^^^^^^^^^^^

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✖ Found 1 problem

```

### `0: formatted`

```
<div scope={scope} />;

```

### `1`

```

 unknown:1 lint/jsx-a11y/scope ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✖ The scope prop can only be used on th elements.

    <div scope="col" />
    ^^^^^^^^^^^^^^^^^^^

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✖ Found 1 problem

```

### `1: formatted`

```
<div scope='col' />;

```

### `2`

```
✔ No known problems!

```

### `2: formatted`

```
<th scope={scope}></th>;

```

### `3`

```
✔ No known problems!

```

### `3: formatted`

```
<th scope='col'></th>;

```