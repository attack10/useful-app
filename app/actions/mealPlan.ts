// app/actions/mealPlan.ts
'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateMealPlanWithGemini } from '@/lib/gemini';
import { summarizeIngredients } from '@/lib/geminiSummary';
import { regenerateSingleMealWithGemini } from '@/lib/gemini';
import { revalidatePath } from 'next/cache';

export async function createMealPlan(formData: FormData) {
  const servings = Number(formData.get('servings')) || 2;
  const days = Number(formData.get('days')) || 3;
  const ingredientsString = formData.get('ingredients') as string;

  const ingredients = ingredientsString
    ? ingredientsString.split(',').map((i) => i.trim()).filter(Boolean)
    : [];

  if (ingredients.length === 0) {
    throw new Error('食材を入力してください');
  }

  // 1. レシピの生成
  const generatedMeals = await generateMealPlanWithGemini(
    ingredients,
    servings,
    days
  );

  // 2. 生成されたレシピから買い物リスト（総量）もまとめて集計（事前にやっておく！）
  const allDailyIngredients = generatedMeals.map((m) => m.ingredients);
  const totalIngredients = await summarizeIngredients(allDailyIngredients);

  // 3. レシピと集計結果をまとめてDBへ一括保存
  const mealPlan = await prisma.mealPlan.create({
    data: {
      servings,
      days,
      inputIngredients: ingredients,
      totalIngredients: totalIngredients as any, // 👈 集計結果を保存！
      dailyMeals: {
        create: generatedMeals,
      },
    },
  });

  redirect(`/planning/recipes/${mealPlan.id}`);
}

export async function regenerateMealAction(
  dailyMealId: string,
  mealPlanId: string,
  userRequest: string
) {
  if (!userRequest || userRequest.trim() === '') {
    throw new Error('修正要望を入力してください');
  }

  // 1. 対象の MealPlan と DailyMeal を取得
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id: mealPlanId },
    include: { dailyMeals: true },
  });

  const targetMeal = mealPlan?.dailyMeals.find((m) => m.id === dailyMealId);

  if (!mealPlan || !targetMeal) {
    throw new Error('対象の献立が見つかりませんでした');
  }

  // 2. Gemini で該当の料理のみ再生成
  const updatedMealData = await regenerateSingleMealWithGemini(
    {
      servings: mealPlan.servings,
      inputIngredients: mealPlan.inputIngredients,
      currentTitle: targetMeal.title,
      dayNumber: targetMeal.dayNumber,
    },
    userRequest
  );

  // 3. 該当の DailyMeal を DB 更新
  await prisma.dailyMeal.update({
    where: { id: dailyMealId },
    data: {
      title: updatedMealData.title,
      description: updatedMealData.description,
      cookingTimeMinutes: updatedMealData.cookingTimeMinutes,
      ingredients: updatedMealData.ingredients,
      steps: updatedMealData.steps,
      advice: updatedMealData.advice,
    },
  });

  // 4. 更新後の全日程の食材を集めて買い物リスト（totalIngredients）を再計算
  const latestMealPlan = await prisma.mealPlan.findUnique({
    where: { id: mealPlanId },
    include: { dailyMeals: { orderBy: { dayNumber: 'asc' } } },
  });

  if (latestMealPlan) {
    const allIngredients = latestMealPlan.dailyMeals.map(
      (m) => m.ingredients as any[]
    );
    const newTotalIngredients = await summarizeIngredients(allIngredients);

    await prisma.mealPlan.update({
      where: { id: mealPlanId },
      data: {
        totalIngredients: newTotalIngredients as any,
      },
    });
  }

  // 5. キャッシュを破棄して画面を即時更新
  revalidatePath(`/planning/recipes/${mealPlanId}`);
}