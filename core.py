# core.py
class CalculadoraDePrecos:
    def __init__(self, config):
        self.custos_fixos = config.get('custos_fixos', [])
        self.horas_trabalho_dia = config.get('horas_trabalho_dia', 0)
        self.dias_trabalho_semana = config.get('dias_trabalho_semana', 0)
        self.custo_hora = 0
        self.calcular_custo_hora()

    def calcular_custo_hora(self):
        """Calcula o custo da hora de trabalho com base nos custos fixos e na carga horária."""
        total_custos_fixos = sum(item['valor'] for item in self.custos_fixos)
        
        if self.horas_trabalho_dia > 0 and self.dias_trabalho_semana > 0:
            # Usamos 4.2 como média de semanas em um mês
            horas_mensais = (self.horas_trabalho_dia * self.dias_trabalho_semana) * 4.2
            if horas_mensais > 0:
                self.custo_hora = total_custos_fixos / horas_mensais
        else:
            self.custo_hora = 0
            
    def calcular_preco_final(self, produto, margem_lucro, percentual_taxas):
        """
        Calcula o preço final de venda de um produto.
        A fórmula de precificação correta (Markup Divisor) é:
        Preço de Venda = Custo Total / (1 - (%Lucro + %Taxas))
        """
        custo_materiais = 0
        for item in produto['receita']:
            # Custo do material = (Preço do pacote / Qtd no pacote) * Qtd usada
            custo_item = (item['material']['preco_pacote'] / item['material']['qtd_pacote']) * item['qtd_usada']
            custo_materiais += custo_item
            
        custo_mao_de_obra = (produto['tempo_producao_minutos'] / 60) * self.custo_hora
        
        custo_total_producao = custo_materiais + custo_mao_de_obra + produto['custo_embalagem']
        
        # Converte margens para decimal
        margem_lucro_dec = margem_lucro / 100
        percentual_taxas_dec = percentual_taxas / 100
        
        divisor = 1 - (margem_lucro_dec + percentual_taxas_dec)
        
        if divisor <= 0:
            print("\nERRO: A soma da margem de lucro e das taxas não pode ser 100% ou mais.")
            return None

        preco_venda = custo_total_producao / divisor
        lucro_bruto = preco_venda - custo_total_producao

        return {
            "preco_venda_sugerido": preco_venda,
            "custo_total_producao": custo_total_producao,
            "custo_materiais": custo_materiais,
            "custo_mao_de_obra": custo_mao_de_obra,
            "lucro_bruto": lucro_bruto
        }