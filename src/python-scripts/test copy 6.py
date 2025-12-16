import sys
import json
import ply.lex as lex
import ply.yacc as yacc

# ================================
# 標準入力からコードと変数一覧を受け取る
# ================================
# Node.js からは { code: "...", variables: {...} } の形式で送られてくる
incoming = sys.stdin.read()
try:
    payload = json.loads(incoming)
    # code: エディタの文字列
    source = payload.get("code", "")
    # variables: 現在の変数一覧（Node 側で保持している）
    variables = payload.get("variables", {})
except json.JSONDecodeError:
    # JSONの解析に失敗した場合、エラーを返して終了
    print(json.dumps({"error": "JSON decode error"}))
    sys.exit(1)

# 正規化（例：全角コロンを半角コロンに変換）
source = source.replace('：', ':')

# ================================
# Lexer (字句解析)
# ================================

# トークン（単語の種類）一覧
tokens = ('TYPE', 'NAME', 'ASSIGN', 'NUMBER', 'COLON', 'PLUS_ASSIGN')

# PLY の字句解析ルール
def t_COLON(t):
    r':'                # コロン
    return t

def t_ASSIGN(t):        # 代入（←）
    r'←'
    return t

def t_PLUS_ASSIGN(t):   # 加算代入（+=）
    r'\+='
    return t

def t_TYPE(t):
    r'(整数型|文字列型|実数型)'       # 型名
    return t

def t_NAME(t):          # 識別子（変数名）
    r'[a-zA-Z_][a-zA-Z0-9_]*'
    return t

def t_NUMBER(t):
    r'\d+'              # 整数
    t.value = int(t.value)
    return t

t_ignore = ' 　\t\r'    # 無視する文字（半角/全角スペース、タブ、CR）

def t_newline(t):
    r'\n+'              # 改行
    t.lexer.lineno += len(t.value)

def t_error(t):
    # 字句解析エラー
    print(f"字句解析エラー '{t.value}'", file=sys.stderr)
    t.lexer.skip(len(t.value))

# 字句解析器の生成
lexer = lex.lex()

# ================================
# Parser (構文解析)
# ================================

# 宣言して代入（整数）
def p_statement_decl_assign(p):
    'statement : TYPE COLON NAME ASSIGN NUMBER'
    variables[p[3]] = p[5]  # 新規変数または上書き

# 加算代入（x += 数値）
def p_statement_plus_assign(p):
    'statement : NAME PLUS_ASSIGN NUMBER'
    if p[1] in variables:
        variables[p[1]] += p[3]
    else:
        # 未定義変数に加算しようとした場合はエラー
        print(f"エラー: 変数 '{p[1]}' が未定義です", file=sys.stderr)

def p_error(p):
    if p:
        print(f"構文エラー \"{p.type}\" ({p.value})", file=sys.stderr)
    else:
        print("構文エラー: 構文が未完成", file=sys.stderr)

# 構文解析器の生成
parser = yacc.yacc()

# ================================
# 実行
# ================================
parser.parse(source)

# ================================
# 出力（Node.js 側に返す）
# ================================
# ensure_ascii=False : 非ASCII文字をエスケープしない（日本語をそのまま出力）
print(json.dumps(variables, ensure_ascii=False))
