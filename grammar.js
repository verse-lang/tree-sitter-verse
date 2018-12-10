const PREC = {
	SEQ: 0,
	ASSIGN: 1,
	L_OR: 2,
	L_AND: 3,
	OR: 4,
	XOR: 5,
	AND: 6,
	EQL: 7,
	COMP: 8,
	SHIFT: 9,
	ADD: 10,
	MULT: 11,
	PRE: 12,
	POST: 13,
	NEW: 14,
	CALL: 15,
	MEMBER: 16
};

module.exports = grammar({
	name: "verse",

	extras: $ => [
		/[ \t\r]/,
		$._comment
	],

	rules: { // The production rules of the context-free grammar
		program: $ => repeat1($._line),
		_line: $ => seq(
			optional(choice(
				$.classDef,
				$.funcDef,
				$.varDef,
				$.statement,
				$.directive,
				$.return
			)),
			"\n"
		),

		classDef: $ => prec(2, seq(
			"class",
			$._typeName,
			optional($._templateDef),
			repeat(choice(
				$._typeAndIdent,
				"|"
			))
		)),
		funcDef: $ => prec(1, seq(
			$._identifier,
			repeat($._typeAndIdent),
			optional(seq(
				"=>",
				$._type
			))
		)),
		varDef: $ => seq(
			$._typeAndIdent,
			optional(seq(
				":",
				$._expr
			))
		),
		directive: $ => /else|break|continue|static/,
		statement: $ => seq(
			optional(/if|elif|while|for/),
			$._expr
		),
		return: $ => seq(
			"return",
			optional($._expr)
		),

		_expr: $ => choice(
			$.funcCall,
			$.cast,
			$.subscript,
			$._binaryOp,
			$._unaryOp,
			seq("(", $._expr, ")"),
			$._identifier,
			$._numericLiteral,
			$._characterLiteral
		),
		_unaryOp: $ => choice(
			prec(PREC.NEW, seq("new", $._expr)),
			prec(PREC.POST, seq($._expr, /\+\+|\-\-/)),
			prec.right(PREC.PRE, seq(/[-~!]|\+\+|\-\-|delete/, $._expr))
		),
		_binaryOp: $ => choice(
			prec.left(PREC.MEMBER, seq($._expr, ".", $._expr)),
			prec.left(PREC.MULT, seq($._expr, /[*/%]/, $._expr)),
			prec.left(PREC.ADD, seq($._expr, /[-+]/, $._expr)),
			prec.left(PREC.SHIFT, seq($._expr, /<<|>>/, $._expr)),
			prec.left(PREC.COMP, seq($._expr, /<|>|[<>]=/, $._expr)),
			prec.left(PREC.EQL, seq($._expr, /!?=/, $._expr)),
			prec.left(PREC.AND, seq($._expr, "&", $._expr)),
			prec.left(PREC.XOR, seq($._expr, "^", $._expr)),
			prec.left(PREC.OR, seq($._expr, "|", $._expr)),
			prec.left(PREC.L_AND, seq($._expr, "&&", $._expr)),
			prec.left(PREC.L_OR, seq($._expr, "||", $._expr)),
			prec.right(PREC.ASSIGN, seq($._expr, /([+\-~*/&^|]|<<|>>)?:/, $._expr)),
			prec.left(PREC.SEQ, seq($._expr, ",", $._expr)),
		),
		funcCall: $ => prec.left(PREC.CALL, seq(
			$._identifier,
			"(",
			optional($._expr),
			")"
		)),
		cast: $ => prec.left(PREC.CALL, seq(
			$._type,
			"(",
			$._expr,
			")"
		)),
		subscript: $ => seq(
			$._identifier,
			alias("[", "_s_operator"),
			$._expr,
			alias("]", "_s_operator")
		),
		_typeAndIdent: $ => seq(
			$._type,
			$._identifier,
		),
		_type: $ => seq(
			$._typeName,
			optional(seq(
				alias("<", "_s_operator"),
				repeat1($._type),
				alias(">", "_s_operator")
			)),
			alias(repeat("*"), "_s_operator")
		),
		_templateDef: $ => seq(
			alias("<", "_s_operator"),
			repeat1(seq(
				$._type,
				optional(seq(
					alias("?", "_s_operator"),
					$._type
				)),
				optional(seq(
					alias(":", "_s_operator"),
					$._type
				))
			)),
			alias(">", "_s_operator")
		),

		_comment: $ => /\/\/.*/,

		_identifier: $ => /[a-z][a-zA-Z0-9]*/,
		_operator: $ => /[!#-&*-/:-@^_|~]/,
		_groupDelimiter: $ => /[()\[\]{}]/,
		_numericLiteral: $ => /\d+(\.\d+)?/,
		_typeName: $ => /[A-Z][a-zA-Z0-9]*/,
		_characterLiteral: $ => /\'(\\[\w\W]|[^\\'])\'/
	}
});
