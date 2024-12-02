import { Controller, Body, Get, Post } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { GetRecipesDto } from './dto/get-recipes.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) { }

  @Post()
  async getRecipes(@Body() getRecipesDto: GetRecipesDto) {
    return await this.recipesService.fetchRecipes(getRecipesDto.keyword, getRecipesDto.loadImages);
  }
}