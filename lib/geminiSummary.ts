// lib/geminiSummary.ts
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export interface TotalIngredient {
  name: string;
  totalAmount: string; // 例: "1/2個 + 100g" または "約300g"
  category: string;    // 例: "野菜", "肉類", "調味料" など
  isInputItem: boolean;
}

export async function summarizeIngredients(
  dailyMealsIngredients: Array<{ name: string; amount: string; isInputItem: boolean }[]>
): Promise<TotalIngredient[]> {
  const prompt = `
以下の複数のレシピで使われている全食材リストを読み込み、同じ食材はまとめ（分量を合算し）、買い物や準備がしやすいカテゴリ別に集計してください。

【使用食材データ】
${JSON.stringify(dailyMealsIngredients, null, 2)}

【ルール】
- 同じ食材（例: 1日目のキャベツ1/4個と2日目のキャベツ100g）はまとめて、おおよその合計量を計算・明記してください。
- カテゴリ（例: 野菜・果物, 肉類・魚介類, 豆腐・加工品, 調味料・その他）に分類してください。
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: '集計された食材リスト',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: '食材名' },
            totalAmount: { type: Type.STRING, description: '合計分量（例: 約1個, 300g）' },
            category: { type: Type.STRING, description: 'カテゴリ（野菜, 肉類, 調味料 など）' },
            isInputItem: { type: Type.BOOLEAN, description: '手持ち食材に含まれていたか' },
          },
          required: ['name', 'totalAmount', 'category', 'isInputItem'],
        },
      },
    },
  });

  return JSON.parse(response.text || '[]') as TotalIngredient[];
}