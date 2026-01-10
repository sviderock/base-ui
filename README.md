# _WIP_: An unofficial port of [Base UI](https://base-ui.com) for [SolidJS](https://www.solidjs.com/)

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/msviderok/base-ui/blob/HEAD/LICENSE)
[![npm](https://img.shields.io/npm/v/@msviderok/base-ui-solid)](https://www.npmjs.com/package/@msviderok/base-ui-solid)

## Installation

```bash
npm install @msviderok/base-ui-solid
```

- **[Docs](https://base-ui-docs-solid.vercel.app/)**
- **[Demo](https://based-react-n-solid.vercel.app/)**
- **[OG Base UI](https://github.com/mui/base-ui)**

## Description

- The library is developed to maintain 100% DX compatibility with the original React version (currently based on the **_@base-ui-components/react@1.0.0-beta.1_** release, specifically [this commit](https://github.com/mui/base-ui/tree/b5ed091e5ab52b9730d6cfe87646077a9e4099e3)).

- The documentation is copied from the original React-based docs, so many discrepancies and inconsistencies exist; however, the examples are ready to use.

- To ensure consistency between libraries, this port uses the same test suite as the React version, with only framework-specific adjustments (e.g. `render(<Test />)` in React vs `render(() => <Test />))` in Solid).

<hr />

## Please consider supporting the awesome Base UI team directly on [OpenCollective](https://opencollective.com/mui-org). This port is a gesture of appreciation for the incredible work they’ve been doing.

## License

This project is licensed under the terms of the
[MIT license](/LICENSE).
