export const DAILY_MESSAGES = [
  "Hay personas que te cambian la vida con solo quedarse en ella. Tú eres esa persona para mí.",
  "Antes de conocerte no sabía que podía querer a alguien tanto. Ahora no imagino querer menos.",
  "No te busco porque te necesite. Te elijo porque quiero que estés.",
  "Eres el tipo de persona por la que merece la pena creer en el amor.",
  "Te quiero no como algo que ocurrió, sino como algo que elijo cada día.",
  "Me gustas más de lo que sé explicar y más de lo que a veces muestro.",
  "El mundo se ve diferente desde que estás en él.",
  "No sé cómo contarte cuánto te quiero sin que suene pequeño.",
  "Eres lo mejor que me ha pasado y lo más bonito que tengo.",
  "Hay días que no necesito nada más que saber que existes.",
  "El amor no siempre se dice. A veces se siente en cómo alguien te mira.",
  "Gracias por hacer que este amor sea fácil de creer.",
  "Contigo aprendí que el amor de verdad no duele. Duele la ausencia, que no es lo mismo.",
  "Me alegra tanto que un día dijeras que sí.",
  "No hay nadie más con quien quiera compartir las cosas pequeñas de cada día.",
  "A veces pienso en nosotros y no puedo evitar sonreír.",
  "Eres mi calma favorita.",
  "Todo lo que me gusta de mi vida tiene algo tuyo.",
  "No hace falta que sea perfecto si es contigo.",
  "Eres lo primero en lo que pienso cuando algo bueno me pasa.",
  "Hoy también te quiero. Que no se te olvide.",
  "Hay algo en cómo me miras que hace que todo lo demás importe menos.",
  "El amor real no es de película. Es esto. Es nosotros.",
  "No necesito grandes gestos. Me basta con que estés.",
  "Gracias por quedarte incluso cuando no era fácil quedarse.",
  "Eres la razón por la que creo en las cosas bonitas.",
  "Cada día que pasa contigo es un favorito.",
  "Me enamoré de tu manera de ver el mundo, y desde entonces lo veo diferente.",
  "Contigo todo lo difícil se vuelve más llevadero y todo lo bonito se vuelve más bonito.",
  "No busco perfección. Te busco a ti.",
  "Eres la parte de mi vida que más cuido.",
  "Hay algo tuyo en cada cosa que me hace feliz.",
  "A tu lado incluso los días grises tienen algo de luz.",
  "Te extraño incluso cuando estás cerca.",
  "Eres lo primero en lo que pienso y lo último antes de dormirme.",
  "Me gusta que existas. Me gusta que seas tú.",
  "Contigo hasta el silencio es cómodo.",
  "El tiempo pasa más despacio sin ti y demasiado rápido contigo.",
  "Lo que más me gusta de nosotros es que somos reales.",
  "Hay una versión de mí que solo existe cuando estoy contigo.",
  "Eres de esas personas que hacen que todo valga la pena.",
  "Juntos somos más de lo que creíamos que podríamos ser.",
  "Me alegra tanto que un día nos hayamos encontrado.",
  "Te quiero con todo lo que soy, no solo con lo bonito.",
  "Eres mi hogar aunque no estemos en el mismo sitio.",
  "Cada mensaje tuyo es lo mejor que me puede pasar el día.",
  "No necesito palabras grandes. Con que seas tú me sobra.",
  "Lo nuestro no es perfecto, pero es exactamente lo que quiero.",
  "Gracias por hacerme sentir que soy suficiente.",
  "El amor no siempre grita. A veces solo está, tranquilo y seguro, como tú.",
];

export interface PlanIdea {
  emoji: string;
  title: string;
  desc: string;
}

export const PLAN_IDEAS: PlanIdea[] = [
  { emoji: "🍝", title: "Cena casera especial", desc: "Elegid una receta que nunca hayáis cocinado juntos y preparadla de cero" },
  { emoji: "🎬", title: "Noche de pelis", desc: "Una peli cada uno, palomitas caseras y manta — sin mirar el móvil" },
  { emoji: "🚶", title: "Paseo sin rumbo", desc: "Salid a caminar sin destino y dejad que el camino os lleve a algún sitio nuevo" },
  { emoji: "☕", title: "Café y charla larga", desc: "Sin pantallas, solo vosotros dos hablando de lo que sea durante horas" },
  { emoji: "🎮", title: "Tarde de juegos", desc: "Cartas, juego de mesa o videojuego — lo que tengáis en casa" },
  { emoji: "🌅", title: "Desayuno especial", desc: "Levantaos con calma y preparad un desayuno rico los dos juntos" },
  { emoji: "📸", title: "Sesión de fotos", desc: "Salid a hacer fotos por el barrio o un parque — seréis vuestros propios fotógrafos" },
  { emoji: "🍕", title: "Pizza casera", desc: "Haced la masa desde cero, cada uno pone sus ingredientes favoritos" },
  { emoji: "🎵", title: "Playlist y baile", desc: "Haced una playlist con vuestras canciones y bailad en casa sin vergüenza" },
  { emoji: "🌙", title: "Noche de estrellas", desc: "Salid a un sitio oscuro, tumbad una manta y mirad el cielo juntos" },
  { emoji: "🍦", title: "Ruta de helado", desc: "Salid a tomar algo dulce y dad una vuelta larga por la ciudad" },
  { emoji: "✍️", title: "Cartas de papel", desc: "Escribíos una carta a mano el uno al otro y leedlas juntos en voz alta" },
  { emoji: "🧩", title: "Tarde de puzzle", desc: "Un puzzle difícil, música de fondo y mucha paciencia — el mejor plan sin salir" },
  { emoji: "🎤", title: "Karaoke en casa", desc: "YouTube + micrófono improvisado — las canciones más ridículas ganan" },
  { emoji: "🌿", title: "Mercadillo", desc: "Id a un mercadillo o bazar y mirad cosas sin la obligación de comprar nada" },
  { emoji: "🍳", title: "Brunch tardío", desc: "Tortitas, huevos o lo que más os guste — sin prisas y con buen café" },
  { emoji: "🎨", title: "Tarde de arte", desc: "Pintad algo juntos aunque salga fatal — lo que importa es reíros haciéndolo" },
  { emoji: "📚", title: "Lectura compartida", desc: "Elegid un libro o artículo y leédlo el uno al otro en voz alta" },
  { emoji: "🛁", title: "Spa en casa", desc: "Mascarillas, velas, música suave y tiempo para desconectar juntos" },
  { emoji: "🌳", title: "Picnic improvisado", desc: "Algo rico de la nevera, una manta y un parque — el plan perfecto sin gastar nada" },
];

export function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

export function getDailyMessage(): string {
  return DAILY_MESSAGES[getDayOfYear() % DAILY_MESSAGES.length];
}

export function getDailyPlan(): PlanIdea {
  return PLAN_IDEAS[getDayOfYear() % PLAN_IDEAS.length];
}

export function isFreeDayPlan(): boolean {
  return [0, 1, 5, 6].includes(new Date().getDay());
}
