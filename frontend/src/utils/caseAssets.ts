export const caseCoverImages: Record<string, string> = {
  blackwell: '/capa_blackwell_house.png',
  'o-guarda-chuva-molhado': '/capa_guarda_chuva_molhado.jpg',
  'o-presente-desaparecido': '/capa_presente_desaparecido.jpg',
  'a-heranca-de-vidro': '/capa_heranca_de_vidro.png',
  'o-quarto-7': '/capa_quarto_7.png',
  'o-elevador-que-nao-parou': '/capa_elevador_que_nao_parou.jpg',
  'a-mensagem-das-23h17': '/capa_mensagem_23h17.jpg',
  'o-retrato-que-piscou': '/capa_retrato_que_piscou.jpg',
  'o-sino-das-tres-batidas': '/capa_sino_tres_batidas.jpg',
  'a-fita-sem-rosto': '/capa_fita_sem_rosto.jpg',
  'o-jardim-sem-pegadas': '/capa_jardim_sem_pegadas.jpg',
};

export const getCaseCoverImage = (slug?: string | null, coverImageData?: string | null) => {
  if (slug && caseCoverImages[slug]) return caseCoverImages[slug];
  if (coverImageData) return coverImageData;
  return '/backgrounds/mapa-da-investigacao.png';
};
