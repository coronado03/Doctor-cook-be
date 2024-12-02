import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class RecipesService {
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private readonly DALL_E_API_URL = 'https://api.openai.com/v1/images/generations';

  async fetchRecipes(keyword: string, loadImages: boolean) {
    console.log("load images is")
    console.log(loadImages)
    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a recipe generator that provides simple meal ideas.',
            },
            {
              role: 'user',
              content: `Provide 5 random meal ideas for the keyword "${keyword}". Each idea should include a name and a short description.`,
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new HttpException(
          `OpenAI API Error: ${response.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      const chatGPTMessage = data.choices[0].message.content;

      const recipes = this.parseRecipes(chatGPTMessage);

      if (loadImages) {
        return await this.addImagesToRecipes(recipes);
      }

      return recipes;

    } catch (error) {
      throw new HttpException(
        `Failed to fetch recipes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parseRecipes(response: string): any[] {
    const recipes = response.split('\n').map((line) => {
      const parts = line.split(', ');
      return {
        name: parts[0]?.replace(/^\d+\.\s*Name:\s*/, '').trim(),
        description: parts[1]?.replace('Description: ', '').trim(),
      };
    });

    return recipes.filter((recipe) => recipe.name && recipe.description);
  }

  private async addImagesToRecipes(recipes: any[]): Promise<any[]> {
    const recipesWithImages = [];

    for (const recipe of recipes) {
      try {
        const imageResponse = await fetch(this.DALL_E_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `A delicious dish called ${recipe.name}`,
            n: 1,
            size: '512x512',
          }),
        });

        if (!imageResponse.ok) {
          throw new Error('Failed to generate image');
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.data[0]?.url;

        recipesWithImages.push({
          ...recipe,
          image: imageUrl,
        });
      } catch (imageError) {
        recipesWithImages.push({
          ...recipe,
          image: 'https://via.placeholder.com/1024x1024.png?text=Image+Not+Available',
        });
      }
    }

    return recipesWithImages;
  }
}
