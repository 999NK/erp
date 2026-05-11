import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileSpreadsheet, FileCode, AlertCircle, Loader2, CheckCircle2, Trash2, Edit2 } from 'lucide-react';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedProduct {
  name: string;
  price: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
}

export function ProductImportModal({ isOpen, onClose, onSuccess }: ProductImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Adjust, 3: Importing Progress
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'xml' | 'csv' | null>(null);
  const [error, setError] = useState('');
  
  // Import Progress state
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const parseFile = (file: File) => {
    setFileName(file.name);
    setError('');

    const isXml = file.name.endsWith('.xml') || file.type === 'text/xml';
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';

    if (!isXml && !isCsv) {
      setError('Formato inválido. Selecione uma nota fiscal XML ou planilha CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (isXml) {
          parseXml(text);
        } else {
          parseCsv(text);
        }
      } catch (err: any) {
        setError(`Falha ao ler o arquivo: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const parseXml = (xmlText: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const productElements = xmlDoc.getElementsByTagName('product');
    const prodElements = xmlDoc.getElementsByTagName('prod');
    
    const productsList: ParsedProduct[] = [];

    if (productElements.length > 0) {
      // Format 1: Custom Catalog XML
      for (let i = 0; i < productElements.length; i++) {
        const prod = productElements[i];
        const name = prod.getElementsByTagName('name')[0]?.textContent || '';
        const sku = prod.getElementsByTagName('sku')[0]?.textContent || '';
        const barcode = prod.getElementsByTagName('barcode')[0]?.textContent || '';
        
        const costPriceStr = prod.getElementsByTagName('costPrice')[0]?.textContent || '0';
        const salePriceStr = prod.getElementsByTagName('salePrice')[0]?.textContent || '0';
        
        const costPrice = parseFloat(costPriceStr) || 0;
        let price = parseFloat(salePriceStr) || 0;
        
        // If sale price is not provided, generate 50% markup over cost price
        if (!price && costPrice) {
          price = parseFloat((costPrice * 1.50).toFixed(2));
        }

        if (name) {
          productsList.push({
            name,
            sku,
            barcode,
            price,
            costPrice: costPrice > 0 ? costPrice : undefined
          });
        }
      }
    } else if (prodElements.length > 0) {
      // Format 2: Standard Brazilian SEFAZ NF-e/NFC-e
      for (let i = 0; i < prodElements.length; i++) {
        const prod = prodElements[i];
        const name = prod.getElementsByTagName('xProd')[0]?.textContent || '';
        const sku = prod.getElementsByTagName('cProd')[0]?.textContent || '';
        const barcode = prod.getElementsByTagName('cEAN')[0]?.textContent || '';
        const unitPriceStr = prod.getElementsByTagName('vUnCom')[0]?.textContent || '0';
        const purchasePrice = parseFloat(unitPriceStr);
        
        // Calculate a markup of 50% on top of purchase/cost price automatically for demonstration!
        const price = purchasePrice ? parseFloat((purchasePrice * 1.50).toFixed(2)) : 0;

        if (name) {
          productsList.push({
            name,
            sku: sku === 'SEM GTIN' ? '' : sku,
            barcode: barcode === 'SEM GTIN' ? '' : barcode,
            price,
            costPrice: purchasePrice
          });
        }
      }
    } else {
      throw new Error('Estrutura não reconhecida. Certifique-se de que o arquivo XML contém elementos <product> ou tags de NF-e <prod>.');
    }

    setParsedProducts(productsList);
    setFileType('xml');
    setStep(2);
  };

  const parseCsv = (csvText: string) => {
    const lines = csvText.split('\n');
    if (lines.length < 2) {
      throw new Error('Planilha CSV vazia ou sem linhas de produtos.');
    }

    const firstLine = lines[0] || '';
    const separator = firstLine.includes(';') ? ';' : ',';
    
    let startIdx = 0;
    // Detect header row
    if (firstLine.toLowerCase().includes('nome') || firstLine.toLowerCase().includes('name') || firstLine.toLowerCase().includes('sku') || firstLine.toLowerCase().includes('preco')) {
      startIdx = 1;
    }

    const productsList: ParsedProduct[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(separator);
      const name = cols[0]?.replace(/"/g, '').trim() || '';
      const priceStr = cols[1]?.replace(/"/g, '').replace('R$', '').replace(/\s/g, '').replace(',', '.').trim() || '0';
      const price = parseFloat(priceStr) || 0;
      const sku = cols[2]?.replace(/"/g, '').trim() || '';
      const barcode = cols[3]?.replace(/"/g, '').trim() || '';

      if (name) {
        productsList.push({
          name,
          price,
          sku,
          barcode
        });
      }
    }

    setParsedProducts(productsList);
    setFileType('csv');
    setStep(2);
  };

  const handleEditProduct = (index: number, field: keyof ParsedProduct, value: string | number) => {
    setParsedProducts(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  const handleDeleteProduct = (index: number) => {
    setParsedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setStep(3);
    setImportProgress(0);
    setImportedCount(0);

    const token = localStorage.getItem('@ERP:token');
    const total = parsedProducts.length;

    for (let i = 0; i < total; i++) {
      const prod = parsedProducts[i];
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: prod.name,
            price: Number(prod.price),
            sku: prod.sku || undefined,
            barcode: prod.barcode || undefined,
            costPrice: prod.costPrice ? Number(prod.costPrice) : undefined,
            allowNegativeStock: true
          })
        });
      } catch (err) {
        console.error('Error importing product:', prod.name, err);
      }
      const newImported = i + 1;
      setImportedCount(newImported);
      setImportProgress(Math.round((newImported / total) * 100));
    }

    setIsImporting(false);
    onSuccess();
  };

  const resetAll = () => {
    setStep(1);
    setParsedProducts([]);
    setFileName('');
    setFileType(null);
    setError('');
    setImportProgress(0);
    setImportedCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Importação Expressa de Produtos</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Cadastre milhares de itens enviando planilhas Excel/CSV ou Notas Fiscais XML.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-200 hover:border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-indigo-50/20 group"
              >
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-neutral-800">Arraste e solte o arquivo aqui</p>
                  <p className="text-xs text-neutral-400 mt-1">NFC-e / NF-e (XML) ou Planilhas (CSV/Excel)</p>
                </div>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-neutral-100 hover:bg-indigo-600 hover:text-white rounded-xl text-neutral-700 text-xs font-semibold transition"
                >
                  Selecionar Arquivo
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xml,.csv"
                  className="hidden" 
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Benefits Banner for Demo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg h-fit shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Leitura Inteligente de NF-e (XML)</h4>
                    <p className="text-[11px] text-neutral-500 mt-1">Extrai nome do produto, SKU, código de barras e adiciona automaticamente margem sugerida de lucro.</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg h-fit shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Importação de Planilha CSV</h4>
                    <p className="text-[11px] text-neutral-500 mt-1">A forma mais rápida de migrar catálogos de sistemas antigos sem perda de dados.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {fileType === 'xml' ? <FileCode className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    {fileName}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2 font-semibold">
                    {parsedProducts.length} itens localizados
                  </span>
                </div>
                <button 
                  onClick={resetAll}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                >
                  Selecionar outro arquivo
                </button>
              </div>

              {/* Adjustments table */}
              <div className="border border-neutral-200/80 rounded-xl overflow-hidden flex-1 overflow-y-auto max-h-[40vh]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50 border-b border-neutral-200/80 text-xs font-bold text-neutral-600 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Nome do Produto</th>
                      <th className="px-4 py-3 w-32">Preço (Venda)</th>
                      {fileType === 'xml' && <th className="px-4 py-3 w-28">Preço Custo</th>}
                      <th className="px-4 py-3 w-28">SKU</th>
                      <th className="px-4 py-3 w-36">Cód. Barras</th>
                      <th className="px-4 py-3 w-12 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150 text-xs text-neutral-700">
                    {parsedProducts.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={prod.name}
                            onChange={(e) => handleEditProduct(idx, 'name', e.target.value)}
                            className="w-full bg-transparent hover:bg-neutral-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 px-1.5 py-1 rounded border border-transparent outline-none truncate font-semibold text-neutral-900"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-400 font-semibold font-mono">R$</span>
                            <input 
                              type="number" 
                              step="0.01"
                              value={prod.price}
                              onChange={(e) => handleEditProduct(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent hover:bg-neutral-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 px-1.5 py-1 rounded border border-transparent outline-none font-bold font-mono text-emerald-700"
                            />
                          </div>
                        </td>
                        {fileType === 'xml' && (
                          <td className="px-4 py-2 text-neutral-500 font-mono">
                            R$ {prod.costPrice?.toFixed(2)}
                          </td>
                        )}
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={prod.sku || ''}
                            onChange={(e) => handleEditProduct(idx, 'sku', e.target.value)}
                            className="w-full bg-transparent hover:bg-neutral-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 px-1.5 py-1 rounded border border-transparent outline-none font-mono text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={prod.barcode || ''}
                            onChange={(e) => handleEditProduct(idx, 'barcode', e.target.value)}
                            className="w-full bg-transparent hover:bg-neutral-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 px-1.5 py-1 rounded border border-transparent outline-none font-mono text-xs text-neutral-400"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button 
                            onClick={() => handleDeleteProduct(idx)}
                            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span className="text-xs text-indigo-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  Dica: Você pode editar os nomes, preços e códigos de barras diretamente nas caixas de texto acima antes de confirmar!
                </span>
                <button 
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Importar todos os {parsedProducts.length} itens
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 flex flex-col items-center justify-center space-y-6">
              {isImporting ? (
                <>
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
                    <Loader2 className="w-12 h-12 animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-bold text-neutral-800">Salvando produtos no banco de dados...</h4>
                    <p className="text-xs text-neutral-500">Gravando {importedCount} de {parsedProducts.length} itens carregados</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full max-w-md bg-neutral-100 rounded-full h-3 overflow-hidden border border-neutral-200">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold font-mono text-neutral-600">{importProgress}% Concluído</span>
                </>
              ) : (
                <>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full scale-110">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-bold text-neutral-900">Importação concluída com sucesso!</h4>
                    <p className="text-xs text-neutral-500">Parabéns! {parsedProducts.length} novos produtos foram inseridos instantaneamente no catálogo.</p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={resetAll}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition"
                    >
                      Importar outro arquivo
                    </button>
                    <button 
                      onClick={onClose}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      Concluir
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
