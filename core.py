# core.py (refatorado)
class CalculadoraDePrecos:
    def __init__(self, config):
        self.custos_fixos = config.get('custos_fixos', [])
        self.horas_trabalho_dia = config.get('horas_trabalho_dia', 0)
        self.dias_trabalho_semana = config.get('dias_trabalho_semana', 0)
        self.custo_hora = self._calcular_custo_hora()

    def _calcular_custo_hora(self):
        total_custos = sum(item.get('valor', 0) for item in self.custos_fixos)
        horas_mes = self.horas_trabalho_dia * self.dias_trabalho_semana * 4.2
        if horas_mes > 0:
            return total_custos / horas_mes
        return 0

    def calcular_preco_final(self, produto, margem_lucro, percentual_taxas):
        try:
            custo_materiais = sum(
                (item['material']['preco_pacote'] / item['material']['qtd_pacote']) * item['qtd_usada']
                for item in produto['receita']
            )

            custo_mao_obra = (produto['tempo_producao_minutos'] / 60) * self.custo_hora
            custo_total = custo_materiais + custo_mao_obra + produto['custo_embalagem']

            lucro = margem_lucro / 100
            taxas = percentual_taxas / 100
            divisor = 1 - (lucro + taxas)

            if divisor <= 0:
                raise ValueError("Margem de lucro + taxas não pode ser igual ou superior a 100%.")

            preco_venda = custo_total / divisor

            return {
                "preco_venda_sugerido": preco_venda,
                "custo_total_producao": custo_total,
                "custo_materiais": custo_materiais,
                "custo_mao_de_obra": custo_mao_obra,
                "lucro_bruto": preco_venda - custo_total
            }
        except Exception as e:
            print(f"Erro no cálculo do preço final: {e}")
            return None
