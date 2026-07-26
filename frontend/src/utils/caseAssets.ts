export const caseCoverImages: Record<string, string> = {
  blackwell: '/backgrounds/map_blackwell.png',
  'a-heranca-de-vidro': '/capa_heranca_de_vidro.png',
  'o-quarto-7': '/capa_quarto_7.png',
  'o-presente-desaparecido': '/backgrounds/cena-do-crime.png',
  'o-sino-das-tres-batidas': '/capa_sino_tres_batidas.jpg',
  'a-fita-sem-rosto': '/capa_fita_sem_rosto.jpg',
  'o-jardim-sem-pegadas': '/capa_jardim_sem_pegadas.jpg',
};

export const getCaseCoverImage = (slug?: string | null, coverImageData?: string | null) => {
  if (coverImageData) return coverImageData;
  if (slug && caseCoverImages[slug]) return caseCoverImages[slug];
  return '/backgrounds/mapa-da-investigacao.png';
};
