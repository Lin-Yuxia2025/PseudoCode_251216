import sys
import json
import ply.lex as lex
import ply.yacc as yacc

# run-pythonから送られた値を JSON形式の文字列から Pythonオブジェクトに変換する
source = json.loads(sys.stdin.read())
# エディタの文字列を取得
codes = source.get("codes")
# 現在の変数一覧を取得
globalVars = source.get("globalVars")
# 現在の出力を取得
output = source.get("output")
# 次に実行する行を取得
currentLine = source.get("currentLine")
# 関数定義の情報を取得
functions = source.get("functions")
# 関数呼び出しの情報を取得
callStack = source.get("callStack")


# 関数の行番号などを登録する関数
def extract_functions(codes):
    function = {}
    i = 0
    n = len(codes)                      # 行数だから行番号より 1 多くなる
    while i < n:                        # 全ての行を実行まで
        line = codes[i].lstrip()        # 行頭のスペース削除
        if line.startswith('〇'):       # 〇で始まっているか
            start_function = i          # 関数定義の行
            start_process = i + 1       # 関数の処理１行目

            # 関数定義を名前と値に分けていく    〇function(整数型: a, 整数型: b)
            line = line[1:].strip()     # 〇を取り除く  function(整数型: a, 整数型: b) 
            params = []                 # 仮引数の配列を初期化
            name = None

            # 関数名と仮引数を取り出す
            if '(' in line and ')' in line:
                name = line.split('(', 1)[0].strip()                # function
                inside = line.split('(', 1)[1].split(')', 1)[0]     # 整数型: a, 整数型: b
                

                # 仮引数が有るなら、追加していく
                if inside.strip() != "":                # ()の中身があるか確認

                    inside = inside.replace("：", ":")  # 全角コロンを半角に正規化

                    for p in inside.split(','):         # 中身を","で区切り、仮引数の数だけループ
                        ptype = p.split(":", 1)[0]      # 型
                        pname = p.split(":", 1)[1]      # 仮引数名
                        params.append({"type": ptype.strip(), "name": pname.strip()})        # 型と仮引数名を(前後の空白を取ってから)追加

            # 関数の終わりを探す
            j = start_process
            while j < n and not codes[j].lstrip().startswith('〇'):     # 最後の行まで & 次の関数が見つかるまで
                j += 1
            end_after = j  # 関数が終わって次の行　別の関数の〇 or 最後の行の次(無)）

            # 関数の情報を入れる
            if name:    # 関数を見つけていたら
                function[name] = {
                    "start_function": start_function,
                    "start_process": start_process,
                    "end_after": end_after,         # 関数が終わって次の行（次の関数の〇 or 最後の行の次）
                    "params": params,               # 仮引数名と型(辞書) 
                }

            i = j 
        else:
            i += 1
    return function

# 1行目実行時だけ関数を探して登録
if currentLine == 0:
    functions = extract_functions(codes)

# Lexer (字句解析)

# 例外字句をまとめておく
reserved = {
    'return': 'RETURN',   # return は RETURN トークンにする
}

# トークン（単語の種類）一覧
tokens = ('CIRCLE', 'TYPE', 'ARRAY', 'VALUE', 'END', 'NAME', 'NUMBER', 'COLON', 'IF', 'EQUAL', 'ASSIGN', 'ADD', 'PLUS',
        'MINUS', 'MULTI', 'OUT', 'WO', 'NO', 'NI','L_S_BRACKET', 'R_S_BRACKET', 'L_C_BRACKET',
        'R_C_BRACKET', 'L_PAREN', 'R_PAREN', 'COMMA', 'RETURN')

# PLY の字句解析ルール
# (入力文字列からトークンを見つけると、それぞれの関数が呼び出される)
def t_CIRCLE(t): # 関数定義
    r'〇'       
    return t

def t_TYPE(t):
    r'(整数型|文字列型|実数型)'       # ( | ) どれかに一致したら呼び出される
    return t

def t_ARRAY(t):
    r'配列'       
    return t

def t_VALUE(t):
    r'値'       
    return t


def t_END(t):
    r'末尾'       
    return t


def t_NAME(t):                      # 1文字目は英字 or _ 2文字目以降は英字 or 数字 or _
    r'[a-zA-Z_][a-zA-Z0-9_]*'       # 1文字目 [a-zA-Z_] は 英字（a〜z または A〜Z）または _

    t.type = reserved.get(t.value, 'NAME')  # ← reservedに登録した例外字句なら、"NAME"typeではなくそちらに置き換える(無ければNAME)

    return t                        # 2文字目 [a-zA-Z0-9_]* の * は0以上の繰返し(1文字目のみも可能)

def t_NUMBER(t):
    r'\d+'                          # 1桁以上の整数 (\d は 0~9) (+ は 1文字以上の連続)
    t.value = int(t.value)          # 文字列 から 整数型に
    return t

def t_COLON(t):
    r'(:|：)'           
    return t                        # t トークンオブジェクト t.value に見つけた文字列

def t_IF(t):                        # if文
    r'if'
    return t

def t_EQUAL(t):                     # 一致
    r'='
    return t

def t_ASSIGN(t):                    # 代入
    r'←'
    return t

def t_ADD(t):                       # "追加する" (配列の末尾に)
    r'追加する'
    return t

def t_PLUS(t):                      # 加算　（テスト用）
    r'\+='
    return t

def t_MINUS(t):                     # 減算
    r'\-'
    return t

def t_MULTI(t):                     # 乗算
    r'\×'
    return t

def t_OUT(t):                       # 出力
    r'出力する'
    return t

def t_WO(t):                        # 助詞
    r'を'
    return t

def t_NO(t):                        # 助詞
    r'の'
    return t

def t_NI(t):                        # 助詞
    r'に'
    return t
    
def t_L_S_BRACKET(t):          # 左角括弧 Square Bracket
    r'\['
    return t

def t_R_S_BRACKET(t):          # 右角括弧 Square Bracket
    r'\]'
    return t

def t_L_C_BRACKET(t):          # 左波括弧 Curly Bracket
    r'\{'
    return t

def t_R_C_BRACKET(t):          # 右波括弧 Curly Bracket
    r'\}'
    return t

def t_L_PAREN(t):              # 左丸括弧 Parenthesis
    r'\('
    return t

def t_R_PAREN(t):              # 右丸括弧 Parenthesis
    r'\)'
    return t


def t_COMMA(t):                # カンマ
    r','
    return t


t_ignore = ' 　\t\n\r'      # 無視する文字 半角・全角スペース, タブ, 改行, キャリッジリターン

t_ignore_COMMENT = r'//.*'  # "//"以降の文字を無視して、コメントアウト  

# どのトークンルールにもマッチしなかった場合に呼び出される特別なエラーハンドラ
# t にはエラーが起きた時の、現在の位置情報や、文字情報を持つトークン風オブジェクトが入る
def t_error(t):
    # 標準エラー出力 (stderr) に、エラーの原因となった 文字列(t.value) を出力する
    print(f"字句解析エラー '{t.value}'", file=sys.stderr)   # f"" は {} の中の式・変数をその場で文字列に変換する
    # エラーの原因となった文字列(t.valueの桁)を全てスキップ
    t.lexer.skip(len(t.value))

# ここまで定義してきたトークンルールを使って、字句解析器（lexerオブジェクト）を作る
lexer = lex.lex()


# 汎用関数

# 関数が呼び出されているなら、最後に呼んだ関数からlocal変数の"""参照"""を返す
def latest_local():
    if callStack:                               # 呼び出されている
        return callStack[-1]["variables"]
    else:
        return None                             # 無いなら"None"を返す

# 変数がlocal, globalどちらに有るかを返す(local優先)
def find_scope(name):

    localvars = latest_local()   # 関数が呼び出されているならlocal変数の参照を取得

    # 探している変数がlocal, globalどちらに有るかの判定
    if localvars is not None and name in localvars:   # 関数が呼び出されている＆local変数内で見つかる
        return 'local'
    elif name in globalVars:                        # globalで見つかる
        return 'global'
    else:
        return None


# Parser (構文解析)

# 宣言
def p_declaration(p):
    # p[1]TYPE, p[2]COLON, p[3]NAME
    'statement : TYPE COLON NAME'

    name = p[3]
    localvars = latest_local()   # 関数が呼び出されているならlocal変数の参照を取得

    # variablesの、キー(変数名)に初期化
    if localvars is not None:              # 関数が呼び出されている
        localvars[name] = "未定義"         # localに宣言
    else:                                  # 関数が呼び出されてない
        globalVars[name] = "未定義"        # globalに宣言


# 宣言して代入(数値)
def p_declaration_assign(p):
    # p[1]TYPE, p[2]COLON, p[3]NAME, p[4]ASSIGN, p[5]NUMBER
    'statement : TYPE COLON NAME ASSIGN NUMBER'

    name = p[3]
    number = p[5]

    localvars = latest_local()   # 関数が呼び出されているならlocal変数の参照を取得

    # variablesの、キー(変数名)に、値(NUMBER)を入れる 
    if localvars is not None:        # 関数が呼び出されている
        localvars[name] = number     # localに宣言

    else:                           # 関数が呼び出されてない
        globalVars[name] = number   # globalに宣言

# 代入
def p_assign(p):
    'statement : NAME ASSIGN NAME'

    name = p[1]
    valname = p[3]

    localvars = latest_local()
    name_scope = find_scope(name)            # 代入される側がlocal, globalどちらに有るかを取得(local優先)
    val_scope = find_scope(valname)          # 代入する側が  〃

    # 代入する値を先に取得
    if val_scope == 'local':            # localに有る
        value = localvars[valname]
    elif val_scope == 'global':         # globalに有る
        value = globalVars[valname]
    else:                               # None (未定義の変数を代入しようとした場合はエラー)
        print(f"エラー: 変数 '{valname}' が未定義です", file=sys.stderr)

    # 代入処理
    if name_scope == 'local':       # 代入される側が local にある
        localvars[name] = value
    elif name_scope == 'global':    # 代入される側が global にある
        globalVars[name] = value
    else:                           # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)    

# 配列

# 配列を宣言して代入    (宣言時は波括弧　{} {1} {1,2,3})   入ってない、一つだけ、複数
def p_declaration_assign_array(p):
    # 整数型    の       配列       :           name       ←        　{1,2,3}
    # p[1]TYPE, p[2]NO, p[3]ARRAY, p[4]COLON, p[5]NAME, p[6]ASSIGN, p[7]init_array
    'statement : TYPE NO ARRAY COLON NAME ASSIGN init_array'

    name = p[5]
    value = p[7]                   # 代入するPythonのリスト
    localvars = latest_local()

    # variablesの、キー(変数名)に、初期値(init_array)を入れる
    if localvars is not None:        # 関数が呼び出されている
        localvars[name] = value     # localに宣言

    else:                           # 関数が呼び出されてない
        globalVars[name] = value   # globalに宣言


# 配列に入れる初期値 init_array

def p_init_array_empty(p):    #  { } 配列の初期値が空
    'init_array : L_C_BRACKET R_C_BRACKET'
    p[0] = []
    
def p_init_array(p):    # 　　{　　　　1,2,3　　　　}　宣言した配列に入れる初期値
    'init_array : L_C_BRACKET init_array_val R_C_BRACKET'
    p[0] = p[2]  # 中のリストを返す

# 配列に入れる初期値の要素　init_array_val

def p_init_array_num_multi(p):  # 1, 2, 3 配列に入れる初期値が複数
    #                     　　　　　　　　　　値が3つ以上の時、右に ｝が来るまで ↓ を繰り返す
    #                                          init_array_val  COMMA   NUMBER
    'init_array_val : init_array_val COMMA NUMBER'  # 1,2       ,     3
    # 配列のリストに加える
    p[0] = p[1] + [p[3]]

def p_init_array_num_single(p): 
    'init_array_val : NUMBER'
    # 配列のリストに
    p[0] = [p[1]]

# 配列の末尾に"整数値"を追加
# "'NAME'の末尾に'NUMBER'を追加する"
def p_add_end_of_array(p):  
    'statement : NAME NO END NI NUMBER WO ADD' # 配列名 : [1],  値(NUMBER) : [5]
    
    array_name = p[1]
    value = p[5]
    localvars = latest_local()
    scope = find_scope(array_name)

    # 追加処理
    if scope == 'local':                # 代入される側が local にある
        localvars[array_name].append(value)
    elif scope == 'global':             # 代入される側が global にある
        globalVars[array_name].append(value)
    else:                           # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 変数 '{array_name}' が未定義です", file=sys.stderr)    


# 配列の末尾に"配列の要素一つ"を追加
# 'arrayの末尾にARRAY[2]の値を追加する'
# " 'NAME'の末尾に'NAME[NUMBER]'の値を追加する "
def p_add_end_of_array(p):
    # 配列名 : [1],  値(NAME) : [5], 要素番号: [7]
    'statement : NAME NO END NI NAME L_S_BRACKET NUMBER R_S_BRACKET NO VALUE WO ADD' 
    
    array_name = p[1]       #  追加される配列名
    val_array_name = p[5]   #  追加する値の配列名 
    number = p[7]           #  追加する値の要素番号

    localvars = latest_local()
    name_scope = find_scope(array_name)            # 代入される側がlocal, globalどちらに有るかを取得(local優先)
    val_scope = find_scope(val_array_name)          # 代入する側が  〃

    # 代入する値を先に取得

    # まず、代入に使う配列を取得
    if val_scope == 'local':            # localに有る
        value_array = localvars[val_array_name]
    elif val_scope == 'global':         # globalに有る
        value_array = globalVars[val_array_name]
    else:                               # None (未定義の配列を代入しようとした場合はエラー)
        print(f"エラー: 変数 '{val_array_name}' が未定義です", file=sys.stderr)

    # 配列から指定した要素番号の値を取得
    value = value_array[number]

    # 配列の末尾に値を追加する処理

    # 追加される側の配列名が variables に存在するか確認
    if name_scope == 'local':                   # localに有る
        localvars[array_name].append(value)    
    elif name_scope == 'global':                # globalに有る
        globalVars[array_name].append(value)
    else:                                       # 存在しない(name_scopeにNoneが入っていた)
        print(f"エラー: 配列 '{array_name}' が未定義です", file=sys.stderr)


# 加算（変数名 += 数値）    （テスト用）
def p_plus(p):
    'statement : NAME PLUS NUMBER'

    name = p[1]
    value = p[3]
    localvars  = latest_local()
    scope = find_scope(name)
    
    #加算処理

    if scope == 'local':            # localに有る
        localvars[name] += value
    elif scope == 'global':         # globalに有る
        globalVars[name] += value
    else:                           # 未定義の変数に加算しようとした場合はエラー
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)

# 減算（変数名 ← 変数名 - 数値) 変数 - 数値のみ
def p_minus(p):
    'statement : NAME ASSIGN NAME MINUS NUMBER'

    namea = p[1]
    nameb = p[3]
    valueb = p[5]
    localvars  = latest_local()
    scopea = find_scope(namea)
    scopeb = find_scope(nameb)
    
    # 減算される値を取得
    if scopeb == 'local':            # localに有る
        valuea = localvars[nameb]
    elif scopeb == 'global':         # globalに有る
        valuea = globalVars[nameb]
    else:                           # 未定義の変数に加算しようとした場合はエラー
        print(f"エラー: 変数 '{nameb}' が未定義です", file=sys.stderr)
    
    #減算して代入
    if scopea == 'local':            # localに有る
        localvars[namea] = valuea - valueb
    elif scopea == 'global':         # globalに有る
        globalVars[namea] = valuea - valueb
    else:                           # 未定義の変数に乗算しようとした場合はエラー
        print(f"エラー: 変数 '{namea}' が未定義です", file=sys.stderr)



# 乗算代入 (変数名 ← 変数名 × 変数名) （変数名 × 変数名）のみ
def p_multi(p):
    'statement : NAME ASSIGN NAME MULTI NAME'

    namea = p[1]
    nameb = p[3]
    namec = p[5]
    localvars  = latest_local()
    scopea = find_scope(namea)
    scopeb = find_scope(nameb)
    scopec = find_scope(namec)
    
    #乗算する値Bを取得
    if scopeb == 'local':            # localに有る
        valueb = localvars[nameb]
    elif scopeb == 'global':         # globalに有る
        valueb = globalVars[nameb]
    else:
        print(f"エラー: 変数 '{nameb}' が未定義です", file=sys.stderr)

    #乗算する値Cを取得
    if scopec == 'local':            # localに有る
        valuec = localvars[namec]
    elif scopeb == 'global':         # globalに有る
        valuec = globalVars[namec]
    else:
        print(f"エラー: 変数 '{namec}' が未定義です", file=sys.stderr)

    #乗算して代入
    if scopea == 'local':            # localに有る
        localvars[namea] = valueb * valuec
    elif scopea == 'global':         # globalに有る
        globalVars[namea] = valueb * valuec
    else:                           # 未定義の変数に乗算しようとした場合はエラー
        print(f"エラー: 変数 '{namea}' が未定義です", file=sys.stderr)


# 出力  'nameを出力する'
def p_out(p):
    'statement : NAME WO OUT'
    
    name = p[1]
    outc = 1
    localvars = latest_local()
    scope = find_scope(name)
    

    while f'出力{outc}' in output :  # outputに既に 出力1,2...が存在していたら見つからなくなるまで、outcを増やす
        outc += 1

    if scope == 'local':                             # localに有る
        output[f'出力{outc}' ] = localvars[name]
    elif scope == 'global':                          # globalに有る
        output[f'出力{outc}' ] = globalVars[name]
    else:                                            # 未定義の変数"を"出力しようとした場合はエラー
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)


# 関数定義    〇function(整数型: a, 整数型: b)

# 仮引数を"params"にまとめる    (関数定義のスキップに使うだけ)
def p_params_f_empty(p):                    # 仮引数に一つも入ってない
    'params : '
    p[0] = []

def p_params_f(p):                                  # 一つ目の引数
    'params : TYPE COLON NAME params_m'             # 後ろのparams_mに二つ目以降の引数(無なら空)を加える
    p[0] = [p[3]] + p[4]

def p_params_f_array(p):                            # 一つ目の引数(配列)
    'params : TYPE NO ARRAY COLON NAME params_m'    # 後ろのparams_mに二つ目以降の引数(無なら空)を加える
    p[0] = [p[5]] + p[6]


def p_params_more(p):                               # 二つ目以降の引数
    'params_m : COMMA TYPE COLON NAME params_m'     # 後ろのparams_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[4]] + p[5]

def p_params_more_array(p):                         # 二つ目以降の引数(配列)
    'params_m : COMMA TYPE NO ARRAY COLON NAME params_m'     # 後ろのparams_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[6]] + p[7]


def p_params_end(p):                                # 引数の後に何もなければ、params_mを空にして、終了
    'params_m : '
    p[0] = []


# 関数定義(〇)に来た時のスキップ
def p_function_def(p):
    'statement : CIRCLE NAME L_PAREN params R_PAREN'
    info = functions.get(p[2])
    if info:                               # 呼び出した名前の関数が定義されていたら
        p.parser.jump = info['end_after']  # 飛ばす行の値を"jump"に入れる


# 関数の呼び出し    function(a, b)

# 関数呼び出しの引数をargsにまとめる
def p_args_f_empty(p):
    'args : '                           # 引数に一つも入ってない
    p[0] = []

def p_args_f(p):                        # 一つ目の引数
    'args : arg args_m'                 # 後ろのargs_mに二つ目以降の引数(無なら空)を加える
    p[0] = [p[1]] + p[2]

def p_args_more(p):                     # 二つ目以降の引数
    'args_m : COMMA arg args_m'         # 後ろのargs_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[2]] + p[3]

def p_args_end(p):                      # 引数の後に何もなければ、args_mを空にして終了
    'args_m : '
    p[0] = [] 

# 整数の実引数
def p_arg_number(p):
    'arg : NUMBER'
    p[0] = p[1]

# 変数、配列の実引数
def p_arg_array(p):
    'arg : NAME'

    name = p[1]
    localvars = latest_local()
    scope = find_scope(name)

    if scope == 'local':            # localに有る
        p[0] = localvars[name]
    elif scope == 'global':         # globalに有る
        p[0] = globalVars[name]
    


# 関数呼び出し処理
def p_function_call(p):
    'statement : NAME L_PAREN args R_PAREN'

    name = p[1]
    info = functions.get(name)                  # 呼び出す関数名から情報を取得

    if info:                                    # 呼び出した名前の関数が定義されていたら
        params = info.get('params', [])         # 仮引数を取得
        args_list = p[3]
        args_map = {}

    # 辞書からリストに直す
    param_names = []                    # 仮引数名を入れるリストを用意

    for n in params:                    # 仮引数を1つずつ取り出す
        param_names.append(n["name"])   # 辞書内から"name"の値を取り出して追加   {"type": "整数型", "name": "a"}

    # 引数の紐づけ
    for idx, pname in enumerate(param_names):    # enumerateで仮引数リストからインデックス番号と仮引数名を取り出してループ
        args_map[pname] = args_list[idx]         # args_mapに、仮引数と実引数の紐づけを追加していく　

    # "仮引数名": 実引数 の形でvariablesに入れる
    new_local = {}  # callStackをpushしてから、新しいlocal変数に引数を入れるために、仮の辞書を用意
    
    for k, v in args_map.items():
        new_local[k] = v                    # この時点だと、呼び出した関数のlocalvarsが出来ていないから、保持

    p.parser.funcName = name
    p.parser.new_local = new_local
    # p.parser.callArgs = args_map            # 仮引数と実引数の割り当て      (今の所必要なし)
    p.parser.returnLine = currentLine + 1   # 呼び出した位置の次を保持(処理が終わったら飛ばす)
    p.parser.endLine = info["end_after"]    # 呼び出した関数の終了位置(終了して次の行)
    p.parser.jump = info['start_process']   # 関数の処理に飛ばす


# 関数の戻り値を代入   x ← func()      func()の戻り値を～～～という書き方に変更の必要あり？
def p_assign_func_call(p):
    'statement : NAME ASSIGN NAME L_PAREN args R_PAREN'
    name = p[1]                     # 代入先    x      
    f_name = p[3]                   # 関数名    function
    info = functions.get(f_name)    # 関数の情報
    scope = find_scope(name)        # 代入先のスコープ("local"か"global")
    
    # 代入先の参照を取得
    scope_ref = {}                  # 代入先の参照

    if scope == 'local':       # 代入される側が local にある
        scope_ref = latest_local()
    elif scope == 'global':    # 代入される側が global にある
        scope_ref = "global"
    else:                           # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)


    if info:                                    # 呼び出した名前の関数が定義されていたら
        params = info.get('params', [])         # 仮引数を取得
        args_list = p[5]
        args_map = {}

    # 辞書からリストに直す
    param_names = []                    # 仮引数名を入れるリストを用意

    for n in params:                    # 仮引数を1つずつ取り出す
        param_names.append(n["name"])   # 辞書内から"name"の値を取り出して追加   {"type": "整数型", "name": "a"}

    # 引数の紐づけ
    for idx, pname in enumerate(param_names):    # enumerateで仮引数リストからインデックス番号と仮引数名を取り出してループ
        args_map[pname] = args_list[idx]         # args_mapに、仮引数と実引数の紐づけを追加していく　

    # "仮引数名": 実引数 の形でvariablesに入れる
    new_local = {}  # callStackをpushしてから、新しいlocal変数に引数を入れるために、仮の辞書を用意
    
    for k, v in args_map.items():
        new_local[k] = v                    # この時点だと、呼び出した関数のlocalvarsが出来ていないから、保持

    p.parser.funcName = f_name
    p.parser.new_local = new_local
    # p.parser.callArgs = args_map            # 仮引数と実引数の割り当て      (今の所必要なし)
    p.parser.returnLine = currentLine + 1   # 呼び出した位置の次を保持(処理が終わったら飛ばす)
    p.parser.endLine = info["end_after"]    # 呼び出した関数の終了位置(終了して次の行)
    p.parser.jump = info['start_process']   # 
    p.parser.funcAction = {          # 関数をどう使うかの情報
        "type": "assign",            # return後に代入を行う
        "name": name,                # 代入先変数名
        "scope": scope,              # "local"か"global"
        "scope_ref": scope_ref       # local変数の参照 or "global"
    }   

# 関数のreturn(返り値無し)
def p_return(p): 
    'statement : RETURN'

    # returnしたことを知らせる
    p.parser.ret = True

# 関数のreturn(返り値有り)
def p_return_val(p): 
    'statement : RETURN NAME'

    name = p[2]
    localvars = latest_local()
    scope = find_scope(name)          # 返り値がlocal, globalどちらか(globalの値を返すこともありえる？)

    # 返り値を取得
    if scope == 'local':            # localに有る
        value = localvars[name]
    elif scope == 'global':         # globalに有る
        value = globalVars[name]
    else:                           # None (未定義の変数を代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)
    
    # return
    p.parser.ret = True         # returnしたことを知らせる
    p.parser.retValue = value   # 返り値を保持

    

# # 関数のreturn(返り値有り)  ※戻り値を変数のように表示する形式ではなくなったためアウト
# def p_return_val(p): 
#     'statement : RETURN NAME'

#     retc = 1

#     while f'返り値{retc}' in variables :  # variablesに既に"返り値1,2...が存在していたら見つからなくなるまで、retcを増やす
#         retc += 1

#     if p[2] in variables:               # NAME が variables に存在するか
#         variables[f'返り値{retc}' ] = variables[p[2]]
        
#     else:
#         # 未定義の変数"を"返そうとした場合はエラー
#         print(f"エラー: 変数 '{p[2]}' が未定義です", file=sys.stderr)

#     # returnしたことを知らせる
#     p.parser.ret = True


def p_error(p):
    # エラーを起こしたトークンと値を報告
    if p:
        print(f"構文エラー \"{p.type}\" ({p.value})", file=sys.stderr)
    # 構文が完成しないまま終了
    else:
        print("構文エラー: 構文が未完成", file=sys.stderr)



# paraserオブジェクト(構文解析器)の作成
parser = yacc.yacc()

# 実行
code = codes[currentLine]   # 実行する行の取得

parser.parse(code)          # 解析実行

# 関数呼び出しの情報を保持
if hasattr(parser, 'funcName'):     # 構文解析して関数を呼び出したか(関数名があるか)

    # 呼び出し情報をpush
    callStack.append({
        "funcName": getattr(parser, 'funcName', None),      # 関数名をオブジェクトから取得
        "variables": parser.new_local,                      # 保持していた、実引数
        "returnLine": parser.returnLine,                    # 呼び出した次の行
        "endLine": parser.endLine,                          # 関数が終了して次の行
        "funcAction": getattr(parser, 'funcAction', None)   # 関数の返り値を利用するなら、終了後に行う事の情報を追加 
    })

# 次に実行する行の設定
if hasattr(parser, 'jump'):         # parserにjumpがあるか（構文解析してjump行へのスキップが指定されたか)
    currentLine = parser.jump

else:
    currentLine += 1

# 呼び出していた関数の終了
# callStackがある　＆　次の行が呼び出した関数を越えた or returnした
if callStack and currentLine >= callStack[-1]["endLine"] or hasattr(parser, 'ret'):     # -1 後ろから
    endFunc = callStack.pop()                       # 終了する関数呼び出しデータをpop　（この時点でStackからは消える)

    funcAction = endFunc.get("funcAction")          # 終了した関数に返り値を使う処理があるなら取得
    if funcAction is not None:                      # ↑があるなら
        if funcAction["type"] == "assign":              # 返り値を代入なら
            name = funcAction["name"]                       # 代入先の変数名を取得
            value = getattr(parser, 'retValue', None)       # 代入する返り値を取得
            if funcAction["scope"] == "local":              # 代入先がlocal
                localVar = funcAction["scope_ref"]              # 代入先の入ってるローカル変数の参照を取得
                localVar[name] = value                          # 返り値の代入処理
            else:                                           # 代入先がglobal
                globalVars[name] = value                        # 返り値の代入処理

    currentLine = endFunc["returnLine"]        # 関数呼び出し位置の次をcurrentLineに


# 出力
# globalVars, output, currentLine, functions, callStackを文字列型(json)に変換して返す
# 1つのオブジェクト(result)にまとめて返す
result = {
    "globalVars": globalVars,
    "output": output,
    "currentLine": currentLine,
    "functions": functions,
    "callStack": callStack,
}
# json形式にして出力(返す)
# ensure_ascii=False : 非ASCII文字をエスケープしない（文字化け防止）
print(json.dumps(result, ensure_ascii=False))