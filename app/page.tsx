"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, FileText, History, Settings } from "lucide-react"
import { CalculadoraPrecos } from "@/components/calculadora-precos"
import { HistoricoOrcamentos } from "@/components/historico-orcamentos"
import { ConfiguracoesSistema } from "@/components/configuracoes-sistema"
import { RelatoriosFinanceiros } from "@/components/relatorios-financeiros"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [activeTab, setActiveTab] = useState("calculadora")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sistema de Precificação</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Calcule preços justos e lucrativos para seus trabalhos
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="calculadora" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculadora
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculadora">
            <CalculadoraPrecos />
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoOrcamentos />
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosFinanceiros />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ConfiguracoesSistema />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
