"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Orcamento {
  id: string
  cliente: string
  descricao: string
  categoria: string
  custoTotal: number
  precoFinal: number
  data: string
}

export function HistoricoOrcamentos() {
  const { toast } = useToast()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [filtro, setFiltro] = useState("")
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<any>(null)

  useEffect(() => {
    const orcamentosSalvos = JSON.parse(localStorage.getItem("orcamentos") || "[]")
    setOrcamentos(orcamentosSalvos)
  }, [])

  const orcamentosFiltrados = orcamentos.filter(
    (o) =>
      o.cliente.toLowerCase().includes(filtro.toLowerCase()) ||
      o.descricao.toLowerCase().includes(filtro.toLowerCase()) ||
      o.categoria.toLowerCase().includes(filtro.toLowerCase()),
  )

  const excluirOrcamento = (id: string) => {
    const novosOrcamentos = orcamentos.filter((o) => o.id !== id)
    setOrcamentos(novosOrcamentos)
    localStorage.setItem("orcamentos", JSON.stringify(novosOrcamentos))
    toast({
      title: "Orçamento excluído",
      description: "O orçamento foi removido com sucesso",
    })
  }

  const verDetalhes = (orcamento: any) => {
    setOrcamentoSelecionado(orcamento)
  }

  const exportarCSV = () => {
    const csv = [
      ["Cliente", "Descrição", "Categoria", "Custo Total", "Preço Final", "Data"],
      ...orcamentos.map((o) => [
        o.cliente,
        o.descricao,
        o.categoria,
        o.custoTotal.toFixed(2),
        o.precoFinal.toFixed(2),
        new Date(o.data).toLocaleDateString("pt-BR"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "orcamentos.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Histórico de Orçamentos
            <Button onClick={exportarCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </CardTitle>
          <CardDescription>Visualize e gerencie todos os orçamentos salvos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, descrição ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="flex-1"
            />
          </div>

          {orcamentosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {orcamentos.length === 0
                ? "Nenhum orçamento salvo ainda"
                : "Nenhum orçamento encontrado com os filtros aplicados"}
            </div>
          ) : (
            <div className="space-y-4">
              {orcamentosFiltrados.map((orcamento) => (
                <Card key={orcamento.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{orcamento.cliente}</h3>
                          <Badge variant="secondary">{orcamento.categoria}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{orcamento.descricao}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Data: {new Date(orcamento.data).toLocaleDateString("pt-BR")}</span>
                          <span>Custo: R$ {orcamento.custoTotal.toFixed(2)}</span>
                          <span className="font-semibold text-green-600">
                            Preço: R$ {orcamento.precoFinal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => verDetalhes(orcamento)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => excluirOrcamento(orcamento.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {orcamentoSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Orçamento</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setOrcamentoSelecionado(null)} className="w-fit">
              Fechar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Informações Gerais</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Cliente:</strong> {orcamentoSelecionado.cliente}
                  </div>
                  <div>
                    <strong>Categoria:</strong> {orcamentoSelecionado.categoria}
                  </div>
                  <div>
                    <strong>Data:</strong> {new Date(orcamentoSelecionado.data).toLocaleDateString("pt-BR")}
                  </div>
                  <div>
                    <strong>Descrição:</strong> {orcamentoSelecionado.descricao}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Valores</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Horas:</strong> {orcamentoSelecionado.horasTrabalhadas}h
                  </div>
                  <div>
                    <strong>Valor/Hora:</strong> R$ {orcamentoSelecionado.valorHora?.toFixed(2)}
                  </div>
                  <div>
                    <strong>Margem de Lucro:</strong> {orcamentoSelecionado.margemLucro}%
                  </div>
                  <div>
                    <strong>Impostos:</strong> {orcamentoSelecionado.impostos}%
                  </div>
                  <div className="pt-2 border-t">
                    <div>
                      <strong>Custo Total:</strong> R$ {orcamentoSelecionado.custoTotal.toFixed(2)}
                    </div>
                    <div className="text-green-600">
                      <strong>Preço Final:</strong> R$ {orcamentoSelecionado.precoFinal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {orcamentoSelecionado.materiais && orcamentoSelecionado.materiais.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Materiais</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Material</th>
                        <th className="text-right p-2">Qtd</th>
                        <th className="text-right p-2">Valor Unit.</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orcamentoSelecionado.materiais.map((material: any) => (
                        <tr key={material.id} className="border-b">
                          <td className="p-2">{material.nome}</td>
                          <td className="text-right p-2">{material.quantidade}</td>
                          <td className="text-right p-2">R$ {material.valorUnitario.toFixed(2)}</td>
                          <td className="text-right p-2">R$ {material.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
