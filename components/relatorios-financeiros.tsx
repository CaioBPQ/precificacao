"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, FileText, Calendar } from "lucide-react"

interface Orcamento {
  id: string
  cliente: string
  categoria: string
  custoTotal: number
  precoFinal: number
  data: string
}

export function RelatoriosFinanceiros() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [periodoSelecionado, setPeriodoSelecionado] = useState("todos")

  useEffect(() => {
    const orcamentosSalvos = JSON.parse(localStorage.getItem("orcamentos") || "[]")
    setOrcamentos(orcamentosSalvos)
  }, [])

  const filtrarPorPeriodo = (orcamentos: Orcamento[]) => {
    if (periodoSelecionado === "todos") return orcamentos

    const hoje = new Date()
    const dataLimite = new Date()

    switch (periodoSelecionado) {
      case "7dias":
        dataLimite.setDate(hoje.getDate() - 7)
        break
      case "30dias":
        dataLimite.setDate(hoje.getDate() - 30)
        break
      case "90dias":
        dataLimite.setDate(hoje.getDate() - 90)
        break
      default:
        return orcamentos
    }

    return orcamentos.filter((o) => new Date(o.data) >= dataLimite)
  }

  const orcamentosFiltrados = filtrarPorPeriodo(orcamentos)

  const estatisticas = {
    totalOrcamentos: orcamentosFiltrados.length,
    valorTotal: orcamentosFiltrados.reduce((sum, o) => sum + o.precoFinal, 0),
    custoTotal: orcamentosFiltrados.reduce((sum, o) => sum + o.custoTotal, 0),
    lucroTotal: orcamentosFiltrados.reduce((sum, o) => sum + (o.precoFinal - o.custoTotal), 0),
    ticketMedio:
      orcamentosFiltrados.length > 0
        ? orcamentosFiltrados.reduce((sum, o) => sum + o.precoFinal, 0) / orcamentosFiltrados.length
        : 0,
  }

  const categorias = orcamentosFiltrados.reduce(
    (acc, o) => {
      if (!acc[o.categoria]) {
        acc[o.categoria] = { count: 0, valor: 0 }
      }
      acc[o.categoria].count++
      acc[o.categoria].valor += o.precoFinal
      return acc
    },
    {} as Record<string, { count: number; valor: number }>,
  )

  const topClientes = orcamentosFiltrados.reduce(
    (acc, o) => {
      if (!acc[o.cliente]) {
        acc[o.cliente] = { count: 0, valor: 0 }
      }
      acc[o.cliente].count++
      acc[o.cliente].valor += o.precoFinal
      return acc
    },
    {} as Record<string, { count: number; valor: number }>,
  )

  const clientesOrdenados = Object.entries(topClientes)
    .sort(([, a], [, b]) => b.valor - a.valor)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Relatórios Financeiros
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>Análise financeira dos seus orçamentos</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Orçamentos</p>
                <p className="text-2xl font-bold">{estatisticas.totalOrcamentos}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">R$ {estatisticas.valorTotal.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lucro Total</p>
                <p className="text-2xl font-bold text-blue-600">R$ {estatisticas.lucroTotal.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {estatisticas.ticketMedio.toFixed(2)}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categorias).length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(categorias)
                  .sort(([, a], [, b]) => b.valor - a.valor)
                  .map(([categoria, dados]) => (
                    <div key={categoria} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{categoria}</Badge>
                        <span className="text-sm text-gray-600">
                          {dados.count} orçamento{dados.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">R$ {dados.valor.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {clientesOrdenados.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-4">
                {clientesOrdenados.map(([cliente, dados], index) => (
                  <div key={cliente} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{cliente}</p>
                        <p className="text-sm text-gray-600">
                          {dados.count} orçamento{dados.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">R$ {dados.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">R$ {estatisticas.valorTotal.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Custos Totais</p>
              <p className="text-2xl font-bold text-red-600">R$ {estatisticas.custoTotal.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Margem de Lucro</p>
              <p className="text-2xl font-bold text-blue-600">
                {estatisticas.valorTotal > 0
                  ? ((estatisticas.lucroTotal / estatisticas.valorTotal) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
