// lib/gemini.ts
import { GoogleGenAI, Type } from '@google/genai';
import { summarizeIngredients } from './geminiSummary';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// レシピ生成結果の型定義
export interface GeneratedMeal {
  dayNumber: number;
  title: string;
  description: string;
  cookingTimeMinutes: number;
  ingredients: {
    name: string;
    amount: string;
    isInputItem: boolean;
  }[];
  steps: string[];
  advice: string;
}

export async function generateMealPlanWithGemini(
  ingredients: string[],
  servings: number,
  days: number
): Promise<GeneratedMeal[]> {
  const prompt = `
あなたはプロの料理研究家および管理栄養士です。
ユーザーから提供された食材を優先的に使用し、指定された条件に合わせた献立を作成してください。

【条件】
- 人数: ${servings}人前
- 日数: ${days}日分
- 手持ちの食材: ${ingredients.join(', ')}

【制約事項】
- 指定された日数分（1日目〜${days}日目）、毎日異なるジャンルや味付け（和・洋・中など）の料理を提案してください。
- 手持ちの食材以外に不足している基本調味料や追加食材がある場合は、ingredients に含め、isInputItem を false にしてください。
- 各手順（steps）は、料理初心者でもわかりやすい具体的な作業内容にしてください。
`;

  // 出力フォーマットを厳密に定義 (Structured Outputs)
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: '指定された日数分の献立リスト',
        items: {
          type: Type.OBJECT,
          properties: {
            dayNumber: {
              type: Type.INTEGER,
              description: '日数（1から始まる連番）',
            },
            title: {
              type: Type.STRING,
              description: '料理名（例: 豚肉とキャベツの甘辛味噌炒め）',
            },
            description: {
              type: Type.STRING,
              description: '料理の簡単な魅力や特徴（1〜2文）',
            },
            cookingTimeMinutes: {
              type: Type.INTEGER,
              description: 'おおよその調理時間（分）',
            },
            ingredients: {
              type: Type.ARRAY,
              description: '必要な食材と調味料のリスト',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: '食材・調味料名' },
                  amount: { type: Type.STRING, description: '分量（例: 200g, 大さじ1）' },
                  isInputItem: {
                    type: Type.BOOLEAN,
                    description: 'ユーザーが入力した手持ち食材なら true、追加で必要なものなら false',
                  },
                },
                required: ['name', 'amount', 'isInputItem'],
              },
            },
            steps: {
              type: Type.ARRAY,
              description: '調理手順のリスト',
              items: { type: Type.STRING },
            },
            advice: {
              type: Type.STRING,
              description: '調理のコツや日持ち・保存に関するアドバイス',
            },
          },
          required: [
            'dayNumber',
            'title',
            'description',
            'cookingTimeMinutes',
            'ingredients',
            'steps',
            'advice',
          ],
        },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini から応答を取得できませんでした');
  }

  return JSON.parse(text) as GeneratedMeal[];
}

// lib/gemini.ts の末尾に追加

export async function regenerateSingleMealWithGemini(
  mealPlanContext: {
    servings: number;
    inputIngredients: string[];
    currentTitle: string;
    dayNumber: number;
  },
  userRequest: string
): Promise<GeneratedMeal> {
  const prompt = `
あなたはプロの料理研究家です。
提案済みの献立のうち、DAY ${mealPlanContext.dayNumber} の料理「${mealPlanContext.currentTitle}」について、ユーザーから以下の修正リクエストがありました。

【条件】
- 人数: ${mealPlanContext.servings}人前
- 手持ち食材: ${mealPlanContext.inputIngredients.join(', ')}
- 変更対象: DAY ${mealPlanContext.dayNumber}
- ユーザーの修正要望: "${userRequest}"

【制約事項】
- ユーザーの修正要望を最優先で反映した新しい料理を1点提案してください。
- 手持ちの食材をできるだけ活用してください。
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        description: '再生成された単一の料理データ',
        properties: {
          dayNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          cookingTimeMinutes: { type: Type.INTEGER },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING },
                isInputItem: { type: Type.BOOLEAN },
              },
              required: ['name', 'amount', 'isInputItem'],
            },
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          advice: { type: Type.STRING },
        },
        required: [
          'dayNumber',
          'title',
          'description',
          'cookingTimeMinutes',
          'ingredients',
          'steps',
          'advice',
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('料理の再生成に失敗しました');
  }

  const newMeal = JSON.parse(text) as GeneratedMeal;
  // dayNumber を確実に元の日の番号にする
  newMeal.dayNumber = mealPlanContext.dayNumber;
  return newMeal;
}