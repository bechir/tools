import {CSSMediaFeatureName} from "@internal/ast";
import {Builder, Token} from "@internal/formatter";

export default function CSSMediaFeatureName(
	builder: Builder,
	node: CSSMediaFeatureName,
): Token {
	return node.value;
}
