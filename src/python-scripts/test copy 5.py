import sys
import json
import ply.lex as lex
import ply.yacc as yacc

# 標準入力を受け取る
source = sys.stdin.read()

# 正規化
source = source.replace('：', ':')  # 全角コロン　→　半角コロン

# Lexer(字句解析)

# トークン（単語の種類）一覧を定義
tokens = ('TYPE', 'NAME', 'ASSIGN', 'NUMBER', 'COLON')

# PLY の字句解析ルール
def t_COLON(t):
    r':'                # 入力文字列から : を見つけると、この関数が呼び出される
    return t            # t トークンオブジェクト t.value に見つけた文字列

def t_ASSIGN(t):        # 代入
    r'←'
    return t

def t_TYPE(t):
    r'(整数型|文字列型|実数型)'       # ( | ) どれかに一致したら呼び出される
    return t

def t_NAME(t):                      # 1文字目は英字 or _ 2文字目以降は英字 or 数字 or _
    r'[a-zA-Z_][a-zA-Z0-9_]*'       # 1文字目 [a-zA-Z_] は 英字（a〜z または A〜Z）または _
    return t                        # 2文字目 [a-zA-Z0-9_]* の * は0以上の繰返し(1文字目のみも可能) 

def t_NUMBER(t):
    r'\d+'                          # 1桁以上の整数 (\d は 0~9) (+ は 1文字以上の連続)
    t.value = int(t.value)          # 文字列 から 整数型に
    return t

t_ignore = ' 　\t\r'                # 無視する文字 "半角・全角スペース" "タブ" "キャリッジリターン"

# 行のカウント(使用するかは未定、使わない場合、ignoreに追加)
def t_newline(t):
    r'\n+'                          # 1回以上の改行
    t.lexer.lineno += len(t.value)  # 改行の数を lineno に足してカウント

# どのトークンルールにもマッチしなかった場合に呼び出される特別なエラーハンドラ
# t にはエラーが起きた時の、現在の位置情報や、文字情報を持つトークン風オブジェクトが入る
def t_error(t):
    # 標準エラー出力 (stderr) に、エラーの原因となった 文字列(t.value) を出力する
    print(f"字句解析エラー '{t.value}'", file=sys.stderr)   # f"" は {} の中の式・変数をその場で文字列に変換する
    # エラーの原因となった文字列(t.valueの桁)を全てスキップ
    t.lexer.skip(len(t.value))
# ここまで定義してきたトークンルールを使って、字句解析器（lexerオブジェクト）を作る
lexer = lex.lex()

# Parser(構文解析)
variables = {}  # 初期化

# 開始記号
def p_statement(p):
    'statement : declaration'
    p[0] = variables                # p[0] は このルール全体の解析結果（返り値）を入れる場所。

# 宣言して代入(整数)
def p_declaration_assign_number(p):
    # p[1]TYPE, p[2]COLON, p[3]NAME, p[4]ASSIGN, p[5]NUMBER
    'declaration : TYPE COLON NAME ASSIGN NUMBER'
    # variables(辞書)の、キー(変数名)に、値(NUMBER)を入れる
    variables[p[3]] = p[5]

def p_error(p):
    # エラーを起こしたトークンと値を報告
    if p:
        print(f"構文エラー \"{p.type}\" ({p.value})", file=sys.stderr)
    # 構文が完成しないまま終了    
    else:
        print("構文エラー \"構文が未完成\"", file=sys.stderr)

# paraserオブジェクト(構文解析器)の作成
parser = yacc.yacc()

# 実行
parser.parse(source)
# 出力(返り値)
# 辞書型(variables)を文字列型(json)に変換して返す
# ensure_ascii=False    非ASCIIコードをエスケープしない  (文字化け防止
print(json.dumps(variables, ensure_ascii=False))    
