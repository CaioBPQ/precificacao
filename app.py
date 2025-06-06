# app.py
from flask import Flask, render_template, request, jsonify
from core import CalculadoraDePrecos
import database

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular', methods=['POST'])
def calcular():
    try:
        dados = request.get_json()
        config = database.carregar_config()

        produto = {
            "nome": dados.get("nome", ""),
            "tempo_producao_minutos": float(dados.get("tempo_producao_minutos", 0)),
            "custo_embalagem": float(dados.get("custo_embalagem", 0)),
            "receita": dados.get("receita", [])
        }

        margem_lucro = float(dados.get("margem_lucro", 0))
        percentual_taxas = float(dados.get("percentual_taxas", 0))

        calc = CalculadoraDePrecos(config)
        resultado = calc.calcular_preco_final(produto, margem_lucro, percentual_taxas)

        if resultado is None:
            return jsonify({"erro": "Erro no cálculo. Verifique os dados."}), 400

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
