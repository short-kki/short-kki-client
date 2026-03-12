const overrides = new Map<string, boolean>();

export const bookmarkState = {
  set(recipeId: string | number, isBookmarked: boolean) {
    overrides.set(String(recipeId), isBookmarked);
  },
  get(recipeId: string | number): boolean | undefined {
    return overrides.get(String(recipeId));
  },
};
