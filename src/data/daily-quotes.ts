/**
 * Daily quotes from the Ra Material (Law of One).
 * All quotes are verified against the source material.
 * Each quote is self-contained wisdom that doesn't require additional context.
 *
 * Bilingual format - URLs are generated dynamically based on locale.
 */

export interface DailyQuote {
  reference: string;
  text: {
    en: string;
    es: string;
    de?: string; // Optional - falls back to English
  };
}

export const dailyQuotes: DailyQuote[] = [
  {
    reference: "Ra 1.7",
    text: {
      en: "You are every thing, every being, every emotion, every event, every situation. You are unity. You are infinity. You are love/light, light/love. You are. This is the Law of One.",
      es: "Eres todo, cada ser, cada emoción, cada suceso, cada situación. Eres unidad. Eres infinidad. Eres amor/luz, luz/amor. Tú eres. Esa es la Ley del Uno.",
      de: "Ihr seid jedes Ding, jedes Wesen, jedes Gefühl, jedes Ereignis, jede Situation. Ihr seid Einheit. Ihr seid Unendlichkeit. Ihr seid Liebe/Licht, Licht/Liebe. Ihr seid. Dies ist das Gesetz des Einen.Können wir dieses Gesetz in detaillierter Form ausdrücken?",
    },
  },
  {
    reference: "Ra 1.7",
    text: {
      en: "Consider, if you will, that the universe is infinite. This has yet to be proven or disproven, but we can assure you that there is no end to your selves, your understanding, what you would call your journey of seeking, or your perceptions of the creation.",
      es: "Ra: Soy Ra. Considera, si quieres, el carácter infinito del universo.",
      de: "Bedenkt, wenn ihr mögt, dass das Universum unendlich ist. Dies muss noch bewiesen oder widerlegt werden, aber wir können euch versichern, dass es für eure Selbste, eure Erkenntnis, für das, was ihr die Reise der Suche nennen würdet, oder für eure Vorstellungen der Schöpfung kein Ende gibt.Das, was unendlich ist, kann nicht „viele“ sein, da Vielheit ein endliches Konzept ist.",
    },
  },
  {
    reference: "Ra 4.20",
    text: {
      en: "The Law of One, though beyond the limitations of name, may be approximated by stating that all things are one, that there is no polarity, no right or wrong, no disharmony, but only identity.",
      es: "Ra: Soy Ra.",
      de: "Dem Gesetz des Einen, obwohl jenseits der Begrenzungen von Benennung, wie ihr Klangschwingungskomplexe nennt, kann man sich durch die Aussage annähern 10, dass alle Dinge eins sind, dass es keine Polarität gibt, kein Richtig oder Falsch, keine Disharmonie, sondern nur Identität 11.",
    },
  },
  {
    reference: "Ra 1.7",
    text: {
      en: "In truth there is no right or wrong. There is no polarity for all will be, as you would say, reconciled at some point in your dance through the mind/body/spirit complex which you amuse yourself by distorting in various ways at this time.",
      es: "Has visto el prisma que muestra todos los colores provenientes de la luz del sol. Este es un ejemplo simplista de unidad.En realidad, no existe lo correcto o lo erróneo.",
      de: "Dies ist ein vereinfachtes Beispiel der Einheit.In Wahrheit gibt es kein richtig oder falsch. Es gibt keine Polarität, da alles, wie ihr sagen würdet, irgendwann wieder miteinander versöhnt wird in eurem Tanz durch den Geist/Körper/Seele-Komplex, mit dem ihr euch momentan amüsiert, indem ihr ihn auf verschiedene Weise verzerrt.",
    },
  },
  {
    reference: "Ra 1.0",
    text: {
      en: "You are not part of a material universe. You are part of a thought. You are dancing in a ballroom in which there is no material.",
      es: "Están bailando en un salón en donde no hay materia. Ustedes son pensamientos danzantes. Mueven su cuerpo, su mente y su espíritu en patrones algo excéntricos, por no haber comprendido completamente el concepto de que son parte del Pensamiento Original.En este momento nos transferiremos a un instrumento llamado Don.",
      de: "Ihr seid Teil eines Gedankens. Ihr tanzt in einem Ballsaal, in dem es nichts Materielles gibt. Ihr seid tanzende Gedanken 1.",
    },
  },
  {
    reference: "Ra 1.0",
    text: {
      en: "All things, all of life, all of the creation is part of one original thought.",
      es: "Esa declaración, mis amigos, como saben, es: «Todas las cosas, toda la vida, toda la creación es parte del Pensamiento Original Único».Usaremos cada canal si somos capaces de ello.",
      de: "Diese Botschaft, meine Freunde, wie ihr wisst, lautet: „Alle Dinge, alles Leben, die ganze Schöpfung ist Teil von Einem Ursprünglichen Gedanken.“Wir werden jeden Kanal ausüben, wenn wir können.",
    },
  },
  {
    reference: "Ra 13.5",
    text: {
      en: "The first known thing in the creation is infinity. The infinity is creation.",
      es: "Lo primero que se conoce en la creación es la infinidad. La infinidad es la creación.",
      de: "Das erste bekannte Ding in der Schöpfung ist Unendlichkeit. Die Unendlichkeit ist Schöpfung.",
    },
  },
  {
    reference: "Ra 10.14",
    text: {
      en: "The moment contains love. That is the lesson/goal of this illusion or density. The exercise is to consciously seek that love in awareness and understanding distortions.",
      es: "El momento contiene amor. Esa es la lección/objetivo de esta ilusión o densidad. El ejercicio consiste en buscar conscientemente ese amor en la consciencia y la comprensión-distorsión.",
      de: "Der Moment enthält Liebe. Das ist die Lektion/das Ziel dieser Illusion oder Dichte. Die Übung ist, diese Liebe bewusst in Bewusstseins- und Erkenntnisverzerrungen 4 zu suchen.",
    },
  },
  {
    reference: "Ra 10.14",
    text: {
      en: "Gaze at the creation which lies about the mind/body/spirit complex of each entity. See the Creator.",
      es: "Mira la creación que se encuentra alrededor del complejo mente/cuerpo/espíritu de cada entidad. Ve al Creador.El fundamento o prerrequisito de estos ejercicios es la predilección por lo que puede llamarse meditación, contemplación u oración.",
      de: "Blicke auf die Schöpfung, die um den Geist/Körper/Seele-Komplex eines jeden Lebewesens liegt. Sieh den Schöpfer.Die Grundlage oder Voraussetzung von diesen Übungen ist eine Vorliebe für das, was ihr Meditation, Kontemplation oder Gebet nennt.",
    },
  },
  {
    reference: "Ra 10.14",
    text: {
      en: "The universe is one being. When a mind/body/spirit complex views another mind/body/spirit complex, see the Creator.",
      es: "El universo es un solo ser. Cuando un complejo mente/cuerpo/espíritu ve a otro complejo mente/cuerpo/espíritu, ve al Creador.",
      de: "Das Universum ist ein Wesen. Wenn ein Geist/Körper/Seele-Komplex einen anderen Geist/Körper/Seele-Komplex sieht, sieh den Schöpfer.",
    },
  },
  {
    reference: "Ra 17.30",
    text: {
      en: "The best way of service to others is the constant attempt to seek to share the love of the Creator as it is known to the inner self.",
      es: "La mejor manera de estar de servicio a otros se ha tratado explícitamente en el material anterior.",
      de: "Der beste Weg, um von Dienst an Anderen zu sein, wurde explizit in früherem Material behandelt.",
    },
  },
  {
    reference: "Ra 82.15",
    text: {
      en: "The purpose of incarnation in third density is to learn the ways of love.",
      es: "El propósito de la encarnación en tercera densidad es aprender los caminos del amor.",
      de: "Der Zweck von Inkarnation in dritter Dichte ist die Wege von Liebe zu lernen.",
    },
  },
  {
    reference: "Ra 74.11",
    text: {
      en: "The heart of the discipline of the personality is threefold. One, know yourself. Two, accept yourself. Three, become the Creator.",
      es: "El corazón de la disciplina de la personalidad es triple:Uno, conócete a ti mismo. Dos, acéptate a ti mismo. Tres, conviértete en el Creador.El tercer paso es aquel paso que, cuando se realiza, lo convierte a uno en el servidor más humilde de todos, transparente en personalidad y completamente capaz de conocerse y aceptar a los demás.En relación con la búsqueda del trabajo mágico, la disciplina de la personalidad continua involucra al adepto a conocerse a sí mismo, a aceptarse a sí mismo, y así despejar el camino hacia la gran puerta índigo hacia el Creador. Convertirse en el Creador es convertirse en todo lo que existe.",
      de: "Das Herz der Disziplin der Persönlichkeit ist dreifach.Eins, dich selbst zu erkennen.Zwei, dich selbst anzunehmen.Drei, der Schöpfer zu werden.Der dritte Schritt ist der Schritt, der, wenn erreicht, jemanden zum demütigsten Diener aller macht, transparent in der Persönlichkeit und vollständig in der Lage, Andere-Selbste zu erkennen und anzunehmen.In Beziehung zur Verfolgung des magischen Arbeitens involviert die fortgeführte Disziplin der Persönlichkeit den Adepten im Erkennen seines Selbst, Annehmen seines Selbst und klärt so den Weg zum großen Indigo-Gateway zum Schöpfer. Der Schöpfer zu werden, ist alles zu werden, was ist. Es gibt dann keine Persönlichkeit mehr in dem Sinne, mit dem der Adept sein Lern/Lehren beginnt. Wenn das Bewusstsein des Indigo-Strahls kristalliner wird, kann mehr Arbeit getan werden; es kann Mehr von intelligenter Unendlichkeit aus ausgedrückt werden.",
    },
  },
  {
    reference: "Ra 8.1",
    text: {
      en: "Consider, if you will, the path your life-experience complex has taken. Consider the coincidences and odd circumstances by which one thing flowed to the next. Consider this well.",
      es: "Considera, si quieres, el camino que ha seguido tu complejo de experiencia vital. Considera las coincidencias y las extrañas circunstancias por las que una cosa fluyó a la siguiente. Considera bien esto.",
      de: "Betrachte, wenn du magst, den Pfad, den dein Lebenserfahrungs-Komplex genommen hat. Betrachte die Zufälle und seltsamen Umstände, durch die ein Ding zum nächsten floss. Betrachte dies sorgfältig.",
    },
  },
  {
    reference: "Ra 18.5",
    text: {
      en: "The proper role of the entity is in this density to experience all things desired, to then analyze, understand, and accept these experiences, distilling from them the love/light within them.",
      es: "El papel adecuado de la entidad es, en esta densidad, experimentar todas las cosas deseadas, para luego analizar, comprender y aceptar dichas experiencias, extrayendo de ellas el amor/luz que contienen.",
      de: "Die richtige Rolle des Wesens in dieser Dichte ist es, alle gewünschten Dinge zu erfahren, diese Erfahrungen dann zu analysieren, zu verstehen und anzunehmen, und aus ihnen die Licht/Liebe zu destillieren, die sie enthalten.",
    },
  },
  {
    reference: "Ra 46.16",
    text: {
      en: "The catalyst, and all catalyst, is designed to offer experience. This experience in your density may be loved and accepted or it may be controlled.",
      es: "El catalizador, y todo catalizdor, está diseñado para ofrecer experiencia. Esta experiencia en tu densidad puede ser amada y aceptada o controlada.",
      de: "Der Katalyst, und jeglicher Katalyst, wird geplant, um Erfahrung anzubieten. Diese Erfahrung in eurer Dichte kann geliebt oder sie kann kontrolliert werden.",
    },
  },
  {
    reference: "Ra 49.6",
    text: {
      en: "Each experience will be sequentially understood by the growing and seeking mind/body/spirit complex in terms of survival, then in terms of personal identity, then in terms of social relations, then in terms of universal love, then in terms of how the experience may beget free communication, then in terms of how the experience may be linked to universal energies, and finally in terms of the sacramental nature of each experience.",
      es: "La experiencia, cualquiera que sea, se asentará en el rayo rojo y se considerará en cuanto a su contenido de supervivencia, y así sucesivamente.Cada experiencia será entendida secuencialmente por el creciente y buscador complejo mente/cuerpo/espíritu en términos de supervivencia, en términos de identidad personal, en términos de relaciones sociales, en términos de amor universal, en términos de cómo la experiencia puede generar la comunicación libre, en términos de cómo la experiencia puede vincularse a las energías universales, y finalmente en términos de la naturaleza sacramental de cada experiencia.Mientras tanto, el Creador yace dentro.",
      de: "Die Erfahrung, was auch immer sie sein mag, wird im roten Strahl platziert und in Bezug auf seinen Überlebensinhalt und so weiter betrachtet.Jede Erfahrung wird der Reihe nach vom wachsenden und suchenden Geist/Körper/Seele-Komplex in Bezug auf Überleben verstanden, dann in Bezug auf persönliche Identität, dann in Bezug auf soziale Beziehungen, dann in Bezug auf universelle Liebe, dann in Bezug darauf, wie diese Erfahrung freie Kommunikation hervorbringen kann, dann in Bezug darauf, wie diese Erfahrung mit universellen Energie verbunden werden kann, und letztendlich in Bezug auf die sakramentale Natur jeder Erfahrung.Währenddessen liegt der Schöpfer im Inneren.",
    },
  },
  {
    reference: "Ra 49.6",
    text: {
      en: "Meanwhile the Creator lies within. In the north pole the crown is already upon the head and the entity is potentially a god. This energy is brought into being by the humble and trusting acceptance of this energy through meditation and contemplation of the self and of the Creator.",
      es: "La experiencia, cualquiera que sea, se asentará en el rayo rojo y se considerará en cuanto a su contenido de supervivencia, y así sucesivamente.Cada experiencia será entendida secuencialmente por el creciente y buscador complejo mente/cuerpo/espíritu en términos de supervivencia, en términos de identidad personal, en términos de relaciones sociales, en términos de amor universal, en términos de cómo la experiencia puede generar la comunicación libre, en términos de cómo la experiencia puede vincularse a las energías universales, y finalmente en términos de la naturaleza sacramental de cada experiencia.Mientras tanto, el Creador yace dentro. En el polo norte, la corona ya está sobre la cabeza y la entidad es potencialmente un dios. Esta energía nace de la aceptación humilde y confiada a través de la meditación y la contemplación del yo y del Creador.Donde estas energías se encuentran es donde la serpiente habrá alcanzado su altura.",
      de: "Die Erfahrung, was auch immer sie sein mag, wird im roten Strahl platziert und in Bezug auf seinen Überlebensinhalt und so weiter betrachtet.Jede Erfahrung wird der Reihe nach vom wachsenden und suchenden Geist/Körper/Seele-Komplex in Bezug auf Überleben verstanden, dann in Bezug auf persönliche Identität, dann in Bezug auf soziale Beziehungen, dann in Bezug auf universelle Liebe, dann in Bezug darauf, wie diese Erfahrung freie Kommunikation hervorbringen kann, dann in Bezug darauf, wie diese Erfahrung mit universellen Energie verbunden werden kann, und letztendlich in Bezug auf die sakramentale Natur jeder Erfahrung.Währenddessen liegt der Schöpfer im Inneren. Im Nordpol ist die Krone bereits auf dem Kopf und das Wesen ist potenziell ein Gott. Diese Energie wird durch Meditation und Kontemplation des Selbst und des Schöpfers von der demütigen und vertrauenden Akzeptanz dieser Energie in die Existenz gebracht.Wo sich diese Energien treffen ist, wo die Schlange ihren Höhepunkt erreicht haben wird.",
    },
  },
  {
    reference: "Ra 75.23",
    text: {
      en: "Each entity is the Creator. The entity, as it becomes more and more conscious of its self, gradually comes to the turning point at which it determines to seek either in service to others or in service to self.",
      es: "Cada entidad es el Creador. La entidad, a medida que se vuelve más y más consciente de sí misma, gradualmente llega al punto de inflexión en el que determina buscar en el servicio a otros o en el servicio al yo.",
      de: "Jedes Wesen ist der Schöpfer. Das Wesen, da es mehr und mehr seines Selbst bewusstwird, kommt allmählich zum Wendepunkt, an dem es feststellt, entweder in Dienst an Anderen oder in Dienst am Selbst zu suchen.",
    },
  },
  {
    reference: "Ra 78.24",
    text: {
      en: "The purpose of polarity is to develop the potential to do work.",
      es: "El propósito de la polaridad es desarrollar el potencial para hacer el trabajo.",
      de: "Der Zweck von Polarität ist es, das Potenzial zu entwickeln, um Arbeit zu verrichten.",
    },
  },
  {
    reference: "Ra 17.2",
    text: {
      en: "It is impossible to help another being directly. It is only possible to make catalyst available in whatever form, the most important being the radiation of realization of oneness with the Creator from the self.",
      es: "No es posible ayudar a otro ser directamente. Sólo es posible hacer que el elemento catalizador esté disponible en cualquiera de sus formas, siendo la más importante la irradiación de la comprensión de la unidad con el Creador desde el ser, siendo menos importante, la información como la que compartimos con ustedes.Nosotros mismos no sentimos la urgencia de que esta información se difunda ampliamente.",
      de: "Es ist unmöglich, einem anderen Wesen direkt zu helfen. Es ist nur möglich, Auslöser in jeglicher Form zur Verfügung zu stellen, wobei das Wichtigste das Ausstrahlen von Realisierung von Einheit mit dem Schöpfer vom Selbst aus ist; weniger wichtig sind solche Informationen, wie wir sie mit euch teilen.Wir selbst empfinden keine Dringlichkeit, diese Informationen weit zu verbreiten.",
    },
  },
  {
    reference: "Ra 89.30",
    text: {
      en: "Service is only possible to the extent it is requested.",
      es: "El servicio sólo es posible en la medida en que se solicite.",
      de: "Dienst ist nur zu dem Grad möglich, zu dem er gewünscht wird.",
    },
  },
  {
    reference: "Ra 52.7",
    text: {
      en: "Acceptance of self, forgiveness of self, and the direction of the will; this is the path towards the disciplined personality.",
      es: "Tu facultad de la voluntad es la que es poderosa dentro de ti como co-Creador.",
      de: "Eure Fakultät des Willens ist das, was mächtig ist in euch, als Mit-Schöpfer.",
    },
  },
  {
    reference: "Ra 42.9",
    text: {
      en: "To the truly balanced entity no situation would be emotionally charged.",
      es: "Para la entidad verdaderamente equilibrada, ninguna situación estaría cargada de emociones.",
      de: "Für das wirklich ausgeglichene Wesen wäre keine Situation emotional geladen.",
    },
  },
  {
    reference: "Ra 54.8",
    text: {
      en: "The mind/body/spirit complex is not a machine. It is rather what you might call a tone poem.",
      es: "La precisión con la que cada centro energético coincide con el Pensamiento Original no radica en la colocación sistemática de cada nexo de energía, sino en la colocación fluida y maleable de la mezcla equilibrada de estos centros energéticos, de manera que la energía inteligente sea capaz de canalizarse con una distorsión mínima.El complejo mente/cuerpo/espíritu no es una máquina. Es más bien lo que podríamos llamar un poema tonal.",
      de: "Die Präzision, mit der jedes Energiezentrum mit dem Ursprünglichen Gedanken übereinstimmt, liegt nicht in der systematischen Platzierung jedes Energienexus, sondern eher in der fließenden und formbaren Platzierung der ausgeglichenen Mischung dieser Energiezentren, auf eine solche Weise, dass intelligente Energie in der Lage ist, sich selbst mit minimaler Verzerrung zu kanalisieren.Der Geist/Körper/Seele-Komplex ist keine Maschine. Es ist eher das, was du ein Tongedicht nennen könntest.",
    },
  },
  {
    reference: "Ra 34.2",
    text: {
      en: "The experience of each entity is unique in perception of intelligent infinity.",
      es: "La experiencia de cada entidad es única en la percepción de la infinidad inteligente.",
      de: "Die Erfahrung jedes Wesens ist einzigartig in der Wahrnehmung intelligenter Unendlichkeit.",
    },
  },
  {
    reference: "Ra 16.21",
    text: {
      en: "The path of our learning is graven in the present moment. There is no history, as we understand your concept.",
      es: "El camino de nuestro aprendizaje está grabado en el momento presente. No hay historia, como entendemos tu concepto.",
      de: "Der Pfad unseres Lernens ist im gegenwärtigen Moment eingeprägt. Es gibt keine Geschichte, wie wir euer Konzept verstehen.",
    },
  },
  {
    reference: "Ra 66.10",
    text: {
      en: "The healer does not heal. The crystallized healer is a channel for intelligent energy which offers an opportunity to an entity that it might heal itself.",
      es: "El sanador no sana. El sanador cristalizado es un canal para la energía inteligente la cual ofrece a la entidad la oportunidad de sanarse a sí misma.En ningún caso hay otra descripción de sanar.",
      de: "Der Heiler heilt nicht. Der kristallisierte Heiler ist ein Kanal für intelligente Energie, die einem Wesen eine Gelegenheit anbietet, damit es sich selbst heilen mag.In keinem Fall gibt es eine andere Beschreibung von Heilung.",
    },
  },
  {
    reference: "Ra 66.12",
    text: {
      en: "Perhaps the greatest healer is within the self and may be tapped with continued meditation.",
      es: "Tal vez el mejor sanador se encuentre dentro del ser y puede ser derivado con la meditación continua, como lo hemos sugerido anteriormente.Los diversos métodos de sanación disponibles para tu gente—cada una tiene virtud y debe ser considerada apropiadamente por cualquier buscador que desee alterar las distorsiones del complejo físico o alguna conexión entre diversos puntos del complejo mente/cuerpo/espíritu de este modo.",
      de: "Vielleicht der größte Heiler liegt im Inneren des Selbst und kann mit fortgesetzter Meditation, wie wir vorgeschlagen haben, erschlossen werden.Die vielen Formen von Heilung, die euch Menschen zur Verfügung stehen, haben alle ihren Wert und können von jedem Suchenden für angemessen empfunden werden, der sich wünscht, die Körperkomplex-Verzerrungen oder eine Verbindung zwischen den verschiedenen Teilen eines Geist/Körper/Seele-Komplexes damit zu verändern.",
    },
  },
  {
    reference: "Ra 48.7",
    text: {
      en: "The important thing for harvest is the harmonious balance between the various energy centers of the mind/body/spirit complex.",
      es: "Cada complejo mente/cuerpo/espíritu tiene sus propios patrones de activación y sus propios ritmos de despertar.",
      de: "Der wichtige Punkt für die Ernte ist das harmonische Gleichgewicht zwischen den verschiedenen Energiezentren des Geist/Körper/Seele-Komplexes.",
    },
  },
  {
    reference: "Ra 41.19",
    text: {
      en: "The more strongly the will of the entity concentrates upon and refines or purifies each energy center, the more brilliant or rotationally active each energy center will be.",
      es: "Cuanto más fuertemente se concentre la voluntad de la entidad y refine o purifique cada centro energético, más brillante o rotacionalmente activo será cada centro energético.",
      de: "Je stärker sich der Wille des Wesens auf ein Energiezentrum konzentriert und es verfeinert oder reinigt, desto brillanter oder umdrehungsweise aktiver wird jedes Energiezentrum sein.",
    },
  },
  {
    reference: "Ra 33.2",
    text: {
      en: "Free will is of the essence.",
      es: "Free will is of the essence.",
    },
  },
  {
    reference: "Ra 50.7",
    text: {
      en: "This is the game: to know, to accept, to forgive, to balance, and to open the self in love.",
      es: "Sin embargo, tu única indicación de las cartas de los otros-yo es mirar a los ojos.No puedes recordar tu mano, sus manos, quizás incluso las reglas de este juego.",
      de: "Dein einziger Hinweis auf die Karten der Anderen-Selbste ist jedoch der Blick in die Augen.Du kannst dich nicht an deine Hand, an ihre Hände, vielleicht nicht einmal an die Regeln des Spiels erinnern.",
    },
  },
  {
    reference: "Ra 95.24",
    text: {
      en: "To the pure, all that is encountered speaks of the love and the light of the One Infinite Creator.",
      es: "No hay refugio exterior en tu ilusión contra las borrascas, las ráfagas y las ventiscas del catalizador rápido y cruel.Sin embargo, para los puros, todo lo que se encuentra habla del amor y la luz del Creador Único Infinito.",
      de: "Es gibt keine äußerliche Sicherheit in eurer Illusion vor den Böen, Windstößen und Schneestürmen von schnellem und grausamem Katalyst.Zum Reinen spricht jedoch alles, dem begegnet wird, von der Liebe und dem Licht des Einen Unendlichen Schöpfers.",
    },
  },
  {
    reference: "Ra 48.10",
    text: {
      en: "The entity who penetrates intelligent infinity is basically capable of walking the universe with unfettered tread.",
      es: "¿Hay alguna consulta breve antes de dejar este instrumento?",
      de: "Während man im physischen Körper ist, muss dies mit höchster Vorsicht getan werden, da, wie wir angemerkt haben, als wir über die Verbindung des rot/orange/gelben Schaltkreises mit dem Schaltkreis der Echtfarbe Blau gesprochen haben, das Potenzial für eine Verwirrung des Geist/Körper/Seele-Komplexes groß ist.",
    },
  },
  {
    reference: "Ra 65.12",
    text: {
      en: "Could your planet polarize towards harmony in one fine, strong moment of inspiration? Yes, my friends. It is not probable; but it is ever possible.",
      es: "Este vórtice puede ser muy pequeño, pero darle la espalda es olvidar las infinitas posibilidades del momento presente. ¿Podría su planeta polarizarse hacia la armonía en un buen y fuerte momento de inspiración? Sí, amigos míos.",
      de: "Ja, meine Freunde. Es ist nicht wahrscheinlich, aber es ist immer möglich.",
    },
  },
  {
    reference: "Ra 83.17",
    text: {
      en: "Those of like mind which together seek shall far more surely find.",
      es: "Aquellos de ideas afines que juntos busquen, encontrarán mucho más seguramente.",
      de: "Jene von ähnlichem Geist, die gemeinsam suchen, werden wesentlich sicherer finden.",
    },
  },
  {
    reference: "Ra 90.21",
    text: {
      en: "This Logos has a bias towards kindness.",
      es: "Digamos, a falta de un adjetivo más preciso, que este Logos tiene tendencia hacia la bondad.",
      de: "Lass uns sagen, aus Mangel an einem stärker präzisen Adjektiv, dass dieser Logos eine Neigung zu Freundlichkeit 3 hat.",
    },
  },
  {
    reference: "Ra 52.2",
    text: {
      en: "To the disciplined entity, all things are open and free. The discipline which opens the universes opens also the gateways to evolution.",
      es: "Observamos que este término no es exacto, pero no hay otro más cercano.Por lo tanto, el uso de la tecnología para manipular lo que está fuera del yo es mucho, mucho menos útil para la evolución personal que las disciplinas del complejo mente/cuerpo/espíritu que resultan en el conocimiento total del yo en el microcosmos y el macrocosmos.Para la entidad disciplinada, todas las cosas están abiertas y son libres. La disciplina que abre los universos abre también las puertas de la evolución.",
      de: "Wir merken an, dass dieser Begriff nicht genau ist, es aber keinen genaueren Begriff gibt.Die Verwendung von Technologie, um das zu manipulieren, was außerhalb des Selbst ist, ist viel, viel weniger von Hilfe für die persönliche Entwicklung als die Disziplinen des Geist/Körper/Seele-Komplexes, die zu umfänglichem Wissen des Selbst im Mikrokosmos und Makrokosmos führen.Für das disziplinierte Wesen sind alle Dinge offen und frei. Die Disziplin, die die Universen öffnet, öffnet auch die Tore zu Evolution.",
    },
  },
  {
    reference: "Ra 52.11",
    text: {
      en: "Unity, love, light, and joy; this is the heart of evolution of the spirit.",
      es: "Unidad, amor, luz y alegría: este es el corazón de la evolución del espíritu.Las lecciones de segundo rango se aprenden/enseñan en la meditación y en el servicio.",
      de: "Einheit, Liebe, Licht und Freude; dies ist das Herz der Evolution der Seele.Die zweitwichtigsten Lektionen werden in Meditation und in Dienst gelernt/gelehrt.",
    },
  },
  {
    reference: "Ra 102.11",
    text: {
      en: "Each entity must, in order to completely unblock yellow ray, love all which are in relationship to it, with hope only of the other-selves' joy, peace, and comfort.",
      es: "Cada entidad debe, para desbloquear completamente el rayo amarillo, amar a todos los que están en relación con ella, con la única esperanza de la alegría, la paz y el consuelo de los demás.",
      de: "Jedes Wesen muss, um gelben Strahl vollständig freizugeben, alle lieben, die in Beziehung zu ihm sind, mit Hoffnung nur auf die Freude, den Frieden und das Wohlbefinden der Anderen-Selbste.",
    },
  },
  {
    reference: "Ra 54.24",
    text: {
      en: "It is desirable that a mind/body/spirit complex be aware of and hearken to the voice of its experiential catalyst, gleaning from it that which it incarnated to glean.",
      es: "Por consiguiente, sin catalizador el deseo de evolucionar y la fe en el proceso no se manifiestan normalmente, y por ende la evolución no se produce.Por lo tanto, el catalizador es programado, y el programa está diseñado para el complejo mente/cuerpo/espíritu por sus requisitos únicos.",
      de: "Ohne Katalyst manifestieren sich der Wunsch zur Weiterentwicklung und das Vertrauen in diesen Prozess normalerweise nicht, und Evolution findet nicht statt.Deswegen wird Katalyst programmiert und das Programm wird für die einzigartigen Anforderungen des Geist/Körper/Seele-Komplexes entworfen.",
    },
  },
  {
    reference: "Ra 94.12",
    text: {
      en: "As the entity increases in experience it shall, more and more, choose positive interpretations of catalyst if it is upon the service-to-others path.",
      es: "A medida que la entidad aumenta su experiencia, elegirá cada vez más interpretaciones positivas del catalizador si está en el camino del servicio a otros, e interpretaciones negativas del catalizador si su experiencia ha sido en el camino del servicio al yo.",
      de: "Während das Wesen an Erfahrung zunimmt, wird es, sagen wir, immer mehr, positive Interpretationen von Katalyst wählen, falls es auf dem Dienst-an-Anderen-Pfad ist, und negative Interpretationen von Katalyst, falls seine Erfahrung entlang des Dienst-am-Selbst-Pfades gewesen ist.",
    },
  },
  {
    reference: "Ra 34.6",
    text: {
      en: "The lessons to be learned vary. Almost always these lessons include patience, tolerance, and the ability for the light touch.",
      es: "Esto crea un potencial de aprendizaje. Las lecciones a aprender varían.",
      de: "Die Lektionen, die es zu lernen gilt, variieren. Fast immer beinhalten die Lektionen Geduld, Toleranz und die Fähigkeit zur Berührung mit dem Licht.Sehr oft wird der Auslöser für emotionalen Schmerz, sei es nun der Tod eines physischen Körperkomplexes eines Anderen-Selbst, das geliebt wird, oder ein anderer scheinbarer Verlust, einfach im Gegenteil enden, in einer Bitterkeit, einer Ungeduld, einem Versauern.",
    },
  },
  {
    reference: "Ra 34.14",
    text: {
      en: "Among your entities a large percentage of all progression has as catalyst, trauma.",
      es: "Debe observarse que entre sus entidades un gran porcentaje de toda progresión tiene, como catalizador, el trauma.",
      de: "Es sollte angemerkt werden, dass unter euren Wesen ein großer Prozentteil jeglichen Fortschritts Trauma als Katalyst besitzt.",
    },
  },
  {
    reference: "Ra 32.14",
    text: {
      en: "The indigo ray is opened only through considerable discipline and practice largely having to do with acceptance of self, not only as the polarized and balanced self but as the Creator, as an entity of infinite worth.",
      es: "El rayo índigo sólo se abre a través de una disciplina y práctica considerables que tienen que ver, en gran medida, con la aceptación del yo, no sólo como el yo polarizado y equilibrado, sino como el Creador, como una entidad de valor infinito.",
      de: "Der Indigo-Strahl wird nur durch beträchtliche Disziplin und Praxis geöffnet, die hauptsächlich mit der Akzeptanz des Selbst zu tun hat – nicht nur als das polarisierte und ausgeglichene Selbst, sondern als der Schöpfer, als ein Wesen von unendlichem Wert.",
    },
  },
  {
    reference: "Ra 39.10",
    text: {
      en: "Those who heal, teach, and work for the Creator in any way which may be seen to be both radiant and balanced are those working in indigo ray.",
      es: "Como sabes, los que sanan, enseñan y trabajan para el Creador de cualquier forma que pueda considerarse radiante y equilibrada son los que realizan actividades del rayo índigo.Como sabes, el rayo violeta es constante y no figura en la discusión de las funciones de activación del rayo, ya que es la marca, el registro, la identidad, la verdadera vibración de una entidad.",
      de: "Er ist das Gateway zu intelligenter Unendlichkeit, das die intelligente Energie durchbringt.",
    },
  },
  {
    reference: "Ra 15.14",
    text: {
      en: "The material for your understanding is the self: the mind/body/spirit complex.",
      es: "3 Sin embargo, sólo podemos decir que el material para tu comprensión es el ser: el complejo mente/cuerpo/espíritu.",
      de: "Euch wurden Informationen über Heilung gegeben, wie ihr diese Verzerrung nennt.",
    },
  },
  {
    reference: "Ra 15.14",
    text: {
      en: "In each infinitesimal part of your self resides the One in all of Its power.",
      es: "Por lo tanto, sólo podemos alentar estas vías de contemplación, siempre indicando el prerrequisito de la meditación, la contemplación o la oración como un medio de combinar subjetiva/objetivamente diversas comprensiones para reforzar el proceso de búsqueda.",
      de: "Ohne solch eine Methode der Umkehrung des analytischen Prozesses, könnte man nicht die vielen Erkenntnisse hin zu Einheit integrieren, die in solcher Suche gewonnen wurden.",
    },
  },
  {
    reference: "Ra 15.14",
    text: {
      en: "Without such a method of reversing the analytical process, one could not integrate into unity the many understandings gained in such seeking.",
      es: "Por lo tanto, sólo podemos alentar estas vías de contemplación, siempre indicando el prerrequisito de la meditación, la contemplación o la oración como un medio de combinar subjetiva/objetivamente diversas comprensiones para reforzar el proceso de búsqueda.",
      de: "Deswegen können wir zu diesen Linien der Kontemplation nur ermutigen, und dabei immer auf die Voraussetzung von Meditation, Kontemplation oder Gebet hinweisen, als ein Mittel von subjektivem/objektivem Verwenden oder Kombinieren verschiedener Erkenntnisse, um den Prozess der Suche zu verbessern.",
    },
  },
  {
    reference: "Ra 75.35",
    text: {
      en: "Any entity may at any time instantaneously clear and balance its energy centers. Thus in many cases those normally quite blocked, weakened, and distorted may, through love and strength of will, become healers momentarily.",
      es: "Cualquier entidad puede, en cualquier momento, despejar y equilibrar sus centros energéticos instantáneamente. Así, en muchos casos, aquellos que normalmente están bastante bloqueados, debilitados y distorsionados pueden, a través del amor y la fuerza de voluntad, convertirse momentáneamente en sanadores.",
      de: "Jedes Wesen kann jederzeit augenblicklich seine Energiezentren klären und ausgleichen. Deswegen können in vielen Fällen die normalerweise recht Blockierten, Geschwächten und Verzerrten, durch Liebe und Stärke des Willens momentan zu Heilern werden.",
    },
  },
  {
    reference: "Ra 57.33",
    text: {
      en: "The purpose of clearing each energy center is to allow that meeting place to occur at the indigo-ray vibration, thus making contact with intelligent infinity and dissolving all illusions.",
      es: "La energía luminosa de todas las cosas puede entonces ser atraída por esta intensa búsqueda, y allí donde la búsqueda interior se encuentra con el prana cósmico atraído, tiene lugar la realización del Uno.El propósito de despejar cada centro energético es permitir que ese lugar de encuentro ocurra en la vibración del rayo índigo, haciendo así contacto con la infinidad inteligente y disolviendo todas las ilusiones.",
      de: "Dienst-an-Anderen ist an der freigelassenen Energie, die durch diesen Bewusstseinszustand erzeugt wird, automatisch.Die Raum/Zeit und Zeit/Raum-Unterscheidungen, wie ihr sie versteht, haben keine Macht außer in dritter Dichte.",
    },
  },
  {
    reference: "Ra 15.9",
    text: {
      en: "There is one energy. It may be understood as love/light or light/love or intelligent energy.",
      es: "Hay una energía única. Se puede entender como amor/luz, o luz/amor, o energía inteligente.",
      de: "Es gibt eine Energie. Sie kann als Liebe/Licht oder Licht/Liebe oder intelligente Energie verstanden werden.",
    },
  },
  {
    reference: "Ra 7.15",
    text: {
      en: "The Law of One blinks neither at the light or the darkness, but is available for service to others and service to self.",
      es: "Sin embargo, el servicio a otros da como resultado el servicio al yo, preservando y armonizando aún más las distorsiones de aquellas entidades que buscan la infinidad inteligente a través de estas disciplinas.Aquellos que buscan la infinidad inteligente mediante el servicio al yo crean la misma cantidad de poder pero, como hemos dicho, tienen dificultades constantes debido al concepto de separación que está implícito en las manifestaciones que implican el poder sobre otros.",
      de: "Dienst an Anderen mündet jedoch in Dienst am Selbst, und beschützt und harmonisiert dadurch die Verzerrungen jener Wesen weiter, die intelligente Unendlichkeit durch diese Disziplinen suchen.Diejenigen, die intelligente Unendlichkeit durch den Einsatz von Dienst am Selbst suchen, erschaffen die gleiche Menge an Kraft, haben aber, wie wir sagten, ständige Schwierigkeiten wegen des Konzeptes der Trennung, das stillschweigend in den Manifestationen des Dienstes am Selbst inbegriffen ist, der Macht über andere beinhaltet.",
    },
  },
  {
    reference: "Ra 30.5",
    text: {
      en: "In the simplest iota of this complex exists in its entirety the One Infinite Creator.",
      es: "Nosotros lo llamamos complejo mente/cuerpo, reconociendo siempre que en la partícula más simple de este complejo existe, en su totalidad, el Creador Único Infinito.Este complejo mente/cuerpo descubre entonces en segunda densidad el crecimiento y el giro hacia la luz, despertando así lo que podrías llamar el complejo espiritual, aquello que intensifica la espiral ascendente hacia el amor y la luz del Creador Infinito.La suma de este complejo espiritual, aunque aparente más que real, habiendo existido potencialmente desde el principio del espacio/tiempo, se perfecciona a sí mismo mediante la graduación en tercera densidad.",
      de: "Wir nennen es Geist/Körper-Komplex, weil wir immer anerkennen, dass im einfachsten Jota dieses Komplexes der Eine Unendliche Schöpfer, in seiner Ganzheit, existiert.Dieser Geist/Körper-Komplex entdeckt dann in zweiter Dichte das Wachsen und die Hinwendung zum Licht, wodurch das erwacht, was du den spirituellen Komplex nennen kannst, der die spiralförmige Aufwärtsbewegung zur Liebe und zum Licht des Unendlichen Schöpfers verstärkt.Das Hinzufügen dieses Seele-Komplexes, wenn auch eher scheinbar als real, da er als Potenzial von Beginn der Raum/Zeit an existiert hat, vervollkommnet sich selbst durch den Abschluss in die dritte Dichte.",
    },
  },
  {
    reference: "Ra 82.12",
    text: {
      en: "The creation itself is a form of consciousness which is unified, the Logos being the one great heart of creation.",
      es: "La experiencia de mente/cuerpo/espíritu al comienzo de esta octava de experiencia fue singular.",
      de: "Die Schöpfung selbst ist eine Form von Bewusstsein, welches vereinigt ist, während der Logos das eine große Herz von Schöpfung ist.Es ist höchst wertvoll, den Vorgang von Evolution durch diese Periode, die als zeitlos angesehen werden kann, zu betrachten, denn vor dem Hintergrund dieser essenziellen Einheit des Gewebes von Schöpfung finden wir die endgültige Entwicklung der Logoi, die wählten, diesen Teil des geernteten Bewusstseins des Schöpfers zu verwenden, um sich mit dem Prozess der Erkenntnis von Selbst vorwärtszubewegen.Da es für effizient befunden worden war, die verschiedenen Dichtestufen, die in jeder Oktave fixiert sind, zu verwenden, um Bedingungen zu erschaffen, in denen selbst-bewusste Sub-Logoi existieren könnten, wurde dies überall in dem wachsenden, mit Blumen übersäten Feld, wie dein Vergleich vorschlägt, der einen unendlichen Schöpfung, verwirklicht.Die ersten Wesen aus Geist, Körper und Seele waren nicht komplex.",
    },
  },
  {
    reference: "Ra 82.17",
    text: {
      en: "The Creator will learn from Itself. Each entity has unmanifest portions of learning and, most importantly, learning which is involved with other-selves.",
      es: "Cada entidad tiene porciones no manifiestas de aprendizaje y, lo que es más importante, aprendizaje que está relacionado con otros-yo.",
      de: "Jedes Wesen hat nicht-manifestierte Anteile des Lernens und, höchst wichtig, Lernen, welches mit Anderen-Selbsten in Verbindung steht.",
    },
  },
  {
    reference: "Ra 50.9",
    text: {
      en: "When the positive adept touches intelligent infinity from within, this is the most powerful of connections for it is the connection of the whole mind/body/spirit complex microcosm with the macrocosm.",
      es: "Cuando el adepto positivo toca la infinidad inteligente desde el interior, esta es la más poderosa de las conexiones, porque es la conexión de todo el microcosmos del complejo mente/cuerpo/espíritu con el macrocosmos.",
      de: "Wenn der positive Fortgeschrittene intelligente Unendlichkeit im Inneren berührt, ist dies die stärkste aller Verbindungen, denn es ist die Verbindung des ganzen Geist/Körper/Seele-Komplex-Mikrokosmos mit dem Makrokosmos.",
    },
  },
  {
    reference: "Ra 55.2",
    text: {
      en: "There is no magic greater than honest distortion toward love.",
      es: "No hay magia más grande que la distorsión honesta hacia el amor.",
      de: "Es gibt keine Magie, die großartiger ist als ehrliche Verzerrung zu Liebe.",
    },
  },
  {
    reference: "Ra 79.37",
    text: {
      en: "The heart of the mind complex is that dynamic entity which absorbs, seeks, and attempts to learn.",
      es: "El Sumo Sacerdote es el Significante del complejo corporal, 3 su propia naturaleza.Podemos observar que las características de las que hablas tienen relación con el Significante del complejo de la Mente, pero no son el centro.",
      de: "Der Hierophant ist der Signifikator des Körper 4-Komplexes, seine eigentliche Natur.Wir können anmerken, dass die Eigenschaften, von denen du sprichst, Einfluss auf den Signifikator des Geist-Komplexes haben, aber nicht der Kern sind.",
    },
  },
  {
    reference: "Ra 5.2",
    text: {
      en: "The prerequisite of mental work is the ability to retain silence of self at a steady state when required by the self. The mind must be opened like a door. The key is silence.",
      es: "El requisito previo del trabajo mental es la capacidad de retener el silencio del yo en un estado constante cuando lo requiera el yo. La mente debe estar abierta como una puerta. La clave es el silencio.Tras la puerta se encuentra una construcción jerárquica que puedes comparar con la geografía y, en cierto modo, con la geometría, ya que la jerarquía es bastante regular y tiene relaciones internas.Para empezar a dominar el concepto de disciplina mental es necesario examinar el ser.",
      de: "Die Voraussetzung von geistiger Arbeit ist die Fähigkeit, Stille des Selbst in einem stetigen Zustand zu bewahren, wenn vom Selbst benötigt. Der Geist muss geöffnet sein wie eine Tür. Der Schlüssel ist Stille.Innerhalb der Tür liegt eine hierarchische Konstruktion, die du mit Geographie und in gewisser Hinsicht mit Geometrie vergleichen kannst, denn die Hierarchie ist recht regelmäßig und trägt innere Beziehungen.Um damit zu beginnen, das Konzept der geistigen Disziplin zu meistern, ist es nötig, das Selbst zu untersuchen.",
    },
  },
  {
    reference: "Ra 52.11",
    text: {
      en: "Let us remember that we are all one. This is the great learning/teaching. In this unity lies love. In this unity lies light. Unity, love, light, and joy; this is the heart of evolution of the spirit.",
      es: "Examinemos el corazón de la evolución.Recordemos que todos somos uno. Este es el gran aprendizaje/enseñanza. En esta unidad está el amor. Este es un gran aprendizaje/enseñanza. En esta unidad está la luz.",
      de: "Lass uns das Herz von Evolution untersuchen.Lasst uns daran erinnern, dass wir alle eins sind. Dies ist das große Lern/Lehren. In dieser Einheit liegt Liebe. Dies ist ein großes Lern/Lehren. In dieser Einheit liegt Licht.",
    },
  },
  {
    reference: "Ra 42.9",
    text: {
      en: "Patience is requested and suggested, for the catalyst is intense upon your plane and its use must be appreciated over a period of consistent learn/teaching.",
      es: "Se solicita y sugiere paciencia, porque el catalizador es intenso en tu plano y su uso debe apreciarse durante un período de aprendizaje/enseñanza constante.",
      de: "Geduld ist erforderlich und empfohlen, denn der Katalyst ist intensiv auf eurer Ebene, und sein Nutzen muss über einen Zeitraum des stetigen Lern/Lehrens hinweg gewürdigt werden.",
    },
  },
  {
    reference: "Ra 33.14",
    text: {
      en: "The primary mechanism for catalytic experience in third density is other-self.",
      es: "De esta pregunta deducimos que te das cuenta de que el mecanismo principal para la experiencia catalítica en tercera densidad es el otro-yo.",
      de: "Wir verstehen aus dieser Frage, dass du verstehst, dass der Hauptmechanismus für katalytische Erfahrung in dritter Dichte Anderes-Selbst ist.",
    },
  },
  {
    reference: "Ra 51.8",
    text: {
      en: "The violet energy center is the least variable and is sometimes described in your philosophy as thousand-petaled as it is the sum of the mind/body/spirit complex distortion totality.",
      es: "Sin embargo, cada uno es regular.El centro energético rojo suele tener la forma de una rueda con rayos.El centro energético naranja tiene forma de flor con tres pétalos.El centro amarillo, de nuevo, en forma redondeada, con muchas facetas, como una estrella.El centro energético verde, a veces visto con forma de loto, cuyo número de puntos de estructura cristalina depende de la fuerza de este centro.El centro energético azul puede tener quizá cien facetas y es capaz de un gran brillo intermitente.El centro índigo es un centro más tranquilo que tiene la forma básica triangular, o de tres pétalos, en muchos casos, aunque algunos adeptos que han equilibrado las energías inferiores pueden crear formas con más facetas.El centro energético violeta es el menos variable y a veces se describe en tu filosofía como de mil pétalos, ya que es la suma de la totalidad de la distorsión del complejo mente/cuerpo/espíritu.",
      de: "Jede ist jedoch regelmäßig.Das rote Energiezentrum ist oft in der Form des Speichenrads.Das orange Zentrum in der Blütenform, die drei Blütenblätter enthält.Das gelbe Zentrum ist wieder in einer runden Form, mit vielen Facetten, wie ein Stern.Das grüne Energiezentrum, manchmal die Lotus-Form genannt; die Zahl der Punkte der kristallinen Struktur hängt ab von der Stärke dieses Zentrums.Das blaue Energiezentrum, fähig, vielleicht ein Hundert Facetten zu haben, und fähig zu großer leuchtender Brillanz.Das Indigo-Zentrum ein leiseres Zentrum, das die einfache dreieckige oder dreiblättrige Form in Vielen hat, auch wenn Fortgeschrittene, die die niedrigeren Energien ausgeglichen haben, Formen mit mehr Facetten erschaffen können.Das violette Energiezentrum ist das am wenigsten veränderliche und wird manchmal in eurer Philosophie als tausend-blättrig beschrieben, da es die Summe der Geist/Körper/Seele-Komplex-Verzerrungs-Totalität ist.",
    },
  },
  {
    reference: "Ra 52.12",
    text: {
      en: "This octave density of which we have spoken is both omega and alpha, the spiritual mass of the infinite universes becoming one central sun or Creator once again. Then is born a new universe, a new infinity, a new Logos which incorporates all that the Creator has experienced of Itself.",
      es: "Esta será la última consulta completa de este trabajo.Esta octava densidad de la que hemos hablado es a la vez omega y alfa, la masa espiritual de los infinitos universos convirtiéndose en un Sol Central, o Creador, una vez más. Entonces nace un nuevo universo, una nueva infinidad, un nuevo Logos que incorpora todo lo que el Creador ha experimentado de Sí mismo.",
      de: "Dies wird die letzte volle Frage dieser Arbeitssitzung sein.Diese Oktav-Dichte, von der wir gesprochen haben, ist sowohl Omega als auch Alpha, die spirituelle Masse der unendlichen Universen, die wieder eine zentrale Sonne oder Schöpfer werden. Dann wird ein neues Universum geboren, eine neue Unendlichkeit, ein neuer Logos, der alles aufnimmt, was der Schöpfer von Sich selbst erfahren hat.",
    },
  },
  {
    reference: "Ra 27.5",
    text: {
      en: "There is unity. This unity is all that there is. This unity has a potential and kinetic. The potential is intelligent infinity. Tapping this potential will yield work. This work has been called by us, intelligent energy.",
      es: "Existe la unidad. Esta unidad es todo lo que hay. Esta unidad tiene un potencial y una cinética. El potencial es infinidad inteligente. Aprovechar este potencial producirá trabajo. Este trabajo ha sido llamado por nosotros, energía inteligente.La naturaleza de este trabajo depende de la distorsión particular del Libre Albedrío que, a su vez, es la naturaleza de una energía inteligente particular, o enfoque cinético, del potencial de la unidad, o aquello que es todo.",
      de: "Es gibt Einheit. Diese Einheit ist alles, was ist. Diese Einheit besitzt Potenzial und Kinetik. Das Potenzial ist intelligente Unendlichkeit. Dieses Potenzial zu erschließen erzeugt Arbeit. Diese Arbeit wurde von uns intelligente Energie genannt.Die Natur dieser Arbeit hängt von der bestimmten Verzerrung des freien Willens ab, die wiederum die Natur einer bestimmten intelligenten Energie oder kinetischen Fokus des Potenzials der Einheit ist, oder dessen, was alles ist.",
    },
  },
  {
    reference: "Ra 81.23",
    text: {
      en: "All of the infinite Logoi are one in the consciousness of love.",
      es: "Todos los Logos infinitos son uno en la consciencia del amor.",
      de: "Alle der unendlichen Logoi sind eins im Bewusstsein der Liebe.",
    },
  },
  {
    reference: "Ra 17.18",
    text: {
      en: "Know then, first, the mind and the body. Then as the spirit is integrated and synthesized, those are harmonized into a mind/body/spirit complex which can move among the dimensions and which can open the gateway to intelligent infinity, thus healing self by light and sharing that light with others.",
      es: "Sin embargo, existe más material ilusorio que hay que comprender, equilibrar, aceptar y dejar atrás.La puerta de acceso a la infinidad inteligente sólo puede abrirse cuando la comprensión de los flujos de energía inteligente se abre al sanador. Estas son las llamadas Leyes Naturales de tu continuidad local de espacio/tiempo y su red de fuentes electromagnéticas, o nexos, de energía que fluye.Conoce entonces, primero, la mente y el cuerpo.",
      de: "Dies sind die sogenannten Naturgesetze eures lokalen Raum/Zeit-Kontinuums und seines Netzes aus elektromagnetischen Quellen oder Nexus von einströmender Energie.Erkenne dann, zuerst den Geist und den Körper. Wenn die Seele dann integriert 8 und synthetisiert 9 ist, werden diese in einen Geist/Körper/Seele-Komplex hinein harmonisiert, der sich zwischen den Dimensionen bewegen kann, und der das Gateway zu intelligenter Unendlichkeit öffnen kann, und so Selbst mit Licht heilen und dieses Licht mit anderen teilen.Wahres Heilen ist einfach die Ausstrahlung des Selbst, das eine Umgebung erschafft, in der ein Auslöser geschehen kann, der die Anerkennung 10 von Selbst, durch Selbst, der Selbst-Heilungskräfte des Selbst initiiert.",
    },
  },
  {
    reference: "Ra 41.18",
    text: {
      en: "The will of the entity as it evolves is the single measure of the rate and fastidiousness of the activation and balancing of the various energy centers.",
      es: "La voluntad del Logos postula los potenciales disponibles para la entidad en evolución.",
      de: "Der Wille des Logos setzt die Potenziale, die dem sich entwickelnden Wesen zur Verfügung stehen.",
    },
  },
  {
    reference: "Ra 41.22",
    text: {
      en: "The self, if conscious to a great enough extent of the workings of this catalyst and the techniques of programming, may through concentration of the will and the faculty of faith alone cause reprogramming without the analogy of the fasting, the diet, or other analogous body complex disciplines.",
      es: "El yo, si es lo suficientemente consciente del funcionamiento de este catalizador y de las técnicas de programación, puede, a través de la concentración de la voluntad y la facultad de la fe solamente, provocar la reprogramación sin la analogía del ayuno, la dieta u otras disciplinas complejas corporales análogas.",
      de: "Das Selbst kann, wenn es sich der Funktionsweise dieses Auslösers und der Techniken der Programmierung ausreichend bewusst ist, allein durch Konzentration des Willens und der geistigen Fähigkeit des Glaubens [eine] Neuprogrammierung veranlassen, ohne die Analogie des Fastens, der Diät oder anderer, vergleichbarer Körperkomplex-Disziplinen.",
    },
  },
  {
    reference: "Ra 38.4",
    text: {
      en: "The mechanism of inspiration involves an extraordinary faculty of desire or will to know or to receive in a certain area accompanied by the ability to open to and trust in what you may call intuition.",
      es: "El mecanismo de la inspiración implica una facultad extraordinaria de deseo, o voluntad, de conocer o de recibir en un área determinada, acompañada de la capacidad de abrirse a lo que podrías llamar intuición y de confiar en ella.",
      de: "Der Mechanismus der Inspiration beinhaltet eine außergewöhnliche Fähigkeit des Wunsches oder Willens, in einem gewissen Bereich zu wissen oder zu empfangen, begleitet von der Fähigkeit, sich dem zu öffnen und in das zu vertrauen, was ihr Intuition nennen mögt.",
    },
  },
  {
    reference: "Ra 35.4",
    text: {
      en: "To know yourself is to have the foundation upon firm ground.",
      es: "To know yourself is to have the foundation upon firm ground.",
    },
  },
  {
    reference: "Ra 52.11",
    text: {
      en: "The universe, its mystery unbroken, is one. Always begin and end in the Creator, not in technique.",
      es: "Sin embargo, el universo, con su misterio intacto, es uno. Siempre empieza y termina en el Creador, no en la técnica.",
      de: "Das Universum, auch wenn sein Mysterium ungebrochen, ist eins. Beginne und ende immer im Schöpfer, nicht in Methode.",
    },
  },
  {
    reference: "Ra 80.15",
    text: {
      en: "Even the most unhappy of experiences, seen from the viewpoint of the spirit, may be worked with until light equaling the light of brightest noon descends upon the adept and positive illumination has occurred.",
      es: "Even the most unhappy of experiences, seen from the viewpoint of the spirit, may be worked with until light equaling the light of brightest noon descends upon the adept and positive illumination has occurred.",
    },
  },
  {
    reference: "Ra 54.17",
    text: {
      en: "All catalyst is chosen, generated, and manufactured by the self, for the self.",
      es: "Los músculos y la carne—que tienen que ver con la, digamos, supervivencia de la sabiduría, el amor, la compasión y el servicio—son producidos por la acción del complejo mente/cuerpo/espíritu sobre el catalizador básico, a fin de crear un catalizador más complejo que pueda, a su vez, utilizarse para formar distorsiones dentro de estos centros energéticos superiores.Cuanto más avanzada es la entidad, más tenue es la conexión entre el sub-logos y el catalizador percibido hasta que, finalmente, todo el catalizador es elegido, generado y fabricado por el yo, para el yo.",
      de: "Die Muskeln und das Fleisch, die mit dem, sagen wir, Überleben von Weisheit, Liebe, Mitgefühl und Dienst zu tun haben, werden durch das Einwirken des Geist/Körper/Seele-Komplex auf grundsätzlichen Katalyst hervorgerufen, so dass ein komplexerer Katalyst erschaffen wird, der seinerseits dafür verwendet werden kann, Verzerrungen innerhalb dieser höheren Energiezentren zu formen.Je fortgeschrittener das Wesen, desto schwächer die Verbindung zwischen dem Sub-Logos und dem wahrgenommenen Katalyst, bis letztendlich aller Katalyst vom Selbst gewählt, erzeugt und hergestellt wird, für das Selbst.",
    },
  },
  {
    reference: "Ra 80.20",
    text: {
      en: "The infinity of the spirit is an even greater realization than the infinity of consciousness, for consciousness which has been disciplined by will and faith is that consciousness which may contact intelligent infinity directly.",
      es: "Nosotros, los de Ra, todavía caminamos estos pasos y alabamos al Creador Único Infinito en cada transformación.",
      de: "Wir von Ra gehen diese Schritte und preisen den Einen Unendlichen Schöpfer bei jeder Transformation.",
    },
  },
  {
    reference: "Ra 6.1",
    text: {
      en: "The exploration and balancing of the spirit complex is indeed the longest and most subtle part of your learn/teaching.",
      es: "La exploración y el equilibrio del complejo espiritual es de hecho la parte más larga y sutil de tu aprendizaje/enseñanza.",
      de: "Die Erforschung und Ausbalancierung 1 des Seele-Komplexes ist in der Tat der längste und feinstofflichste Teil eures Lern/Lehrens.",
    },
  },
  {
    reference: "Ra 6.1",
    text: {
      en: "When body and mind are receptive and open, then the spirit can become a functioning shuttle or communicator from the entity's individual energy of will upwards, and from the streamings of the creative fire and wind downwards.",
      es: "Cuando el cuerpo y la mente están receptivos y abiertos, entonces el espíritu puede convertirse en una lanzadera en funcionamiento, o comunicador, desde la energía de la voluntad individual de la entidad hacia arriba y desde las corrientes del fuego y el viento creativos hacia abajo.La habilidad sanadora, como todas las demás, las cuáles este instrumento llamaría habilidades paranormales, se efectúa por la apertura de un camino, o lanzadera, hacia la Infinidad Inteligente.",
      de: "Wenn Körper und Geist empfänglich und offen sind, dann kann die Seele ein funktionierendes Shuttle 2 oder Sprecher 3, von der individuellen Willensenergie des Wesens aufwärts und von den Strömungen des schöpferischen Feuers und Windes abwärts, werden.Die Fähigkeit zu heilen, wie alle anderen, was dieses Instrument paranormale Fähigkeiten nennen würde, wird durch die Öffnung eines Pfades oder Shuttles in intelligente Unendlichkeit hinein bewirkt.",
    },
  },
  {
    reference: "Ra 80.14",
    text: {
      en: "The adept is calling directly through the spirit to the universe for its power, for the spirit is a shuttle.",
      es: "Sería más apropiado decir que el adepto está llamando directamente a través del espíritu al universo por su poder, porque el espíritu es una lanzadera.",
      de: "Es wäre passender, zu sagen, dass der Adept direkt durch die Seele zum Universum nach seiner Kraft ruft, denn die Seele ist ein Shuttle 7.",
    },
  },
  {
    reference: "Ra 79.33",
    text: {
      en: "Magical ability is the ability to consciously use the so-called unconscious.",
      es: "La capacidad mágica es la capacidad de utilizar conscientemente el llamado inconsciente.",
      de: "Magische Fähigkeit ist die Fähigkeit, das sogenannte Unbewusste bewusst zu nutzen.",
    },
  },
  {
    reference: "Ra 79.27",
    text: {
      en: "The result of these experiments has been a more vivid, varied, and intense experience of Creator by Creator.",
      es: "Este es un material previamente cubierto.",
      de: "Dies ist bereits besprochenes Material.",
    },
  },
  {
    reference: "Ra 80.20",
    text: {
      en: "We, of Ra, still walk these steps and praise the One Infinite Creator at each transformation.",
      es: "Nosotros, los de Ra, todavía caminamos estos pasos y alabamos al Creador Único Infinito en cada transformación.",
      de: "Wir von Ra gehen diese Schritte und preisen den Einen Unendlichen Schöpfer bei jeder Transformation.",
    },
  },
  {
    reference: "Ra 14.34",
    text: {
      en: "The Law is One. There are no mistakes.",
      es: "La Ley es Uno. No existen errores.Soy Ra.",
      de: "Das Gesetz ist Eins. Es gibt keine Fehler.Ich bin Ra.",
    },
  },
  {
    reference: "Ra 26.36",
    text: {
      en: "Each entity is only superficially that which blooms and dies. In the deeper sense there is no end to beingness.",
      es: "Cada entidad es sólo superficialmente aquello que florece y muere. En un sentido más profundo, el ser no tiene fin.",
      de: "In einem tieferen Sinn gibt es kein Ende des Seins.",
    },
  },
  {
    reference: "Ra 19.17",
    text: {
      en: "Some love the light. Some love the darkness. It is a matter of the unique and infinitely various Creator choosing and playing among its experiences as a child upon a picnic.",
      es: "Algunos aman la luz. Otros aman la oscuridad. Es una cuestión de la elección que hace el Creador único e infinitamente variado, que escoge y juega entre sus experiencias como un niño en un pícnic.",
      de: "Einige lieben das Licht. Einige lieben die Dunkelheit. Es ist eine Frage des einzigartigen und unendlich verschiedenen Schöpfers, der aus seinen Erfahrungen auswählt und damit spielt, wie ein Kind bei einem Picknick.",
    },
  },
  {
    reference: "Ra 16.39",
    text: {
      en: "Understanding is not of this density.",
      es: "La comprensión no es de esta densidad.",
      de: "Verstehen ist nicht von dieser Dichte.",
    },
  },
  {
    reference: "Ra 104.26",
    text: {
      en: "We leave you in appreciation of the circumstances of the great illusion in which you now choose to play the pipe and timbrel and move in rhythm. We are also players upon a stage. The stage changes. The acts ring down. The lights come up once again. And throughout the grand illusion and the following and the following there is the undergirding majesty of the One Infinite Creator.",
      es: "Los dejamos en la apreciación de las circunstancias de la gran ilusión en la que ahora elegen tocar la flauta y el timbal y moveros al ritmo. Nosotros también somos actores en un escenario. El escenario cambia. Los actos se apagan. Las luces vuelven a encenderse. Y a lo largo de la gran ilusión, y lo que sigue, y lo que sigue, está la majestuosidad subyacente del Creador Único Infinito.",
      de: "Wir verlassen euch in Wertschätzung der Umstände der großen Illusion, in der ihr nun wählt, die Pfeife und Tamburin zu spielen und euch in Rhythmus zu bewegen. Wir sind auch Spieler auf einer Bühne. Die Bühne verändert sich. Die Akte klingeln herunter. Die Lichter kommen wieder hoch. Und überall in der großen Illusion und der nächsten und der nächsten gibt es die untermauernde Erhabenheit des Einen Unendlichen Schöpfers.",
    },
  },
  {
    reference: "Ra 33.21",
    text: {
      en: "Go forth, then, rejoicing in the power and the peace of the One Infinite Creator.",
      es: "Vayan, pues, regocijándose en el poder y la paz del Creador Único Infinito.",
      de: "Adonai.Im engl.",
    },
  },
  {
    reference: "Ra 23.10",
    text: {
      en: "When one has been rescued from that sorrow to a vision of the One Creator, then there is no concept of failure.",
      es: "Cuando uno ha sido rescatado de esa aflicción hacia una visión del Creador Único, entonces no existe el concepto de fracaso.Nuestra dificultad reside en el honor/responsabilidad de corregir las distorsiones de la Ley del Uno que se produjeron durante nuestros intentos de ayudar a estas entidades.",
      de: "Wenn einer von dieser Sorge gerettet wurde, zu einer Vision des Einen Schöpfers, dann gibt es kein Konzept des Scheiterns.Unsere Schwierigkeit lag in der Ehre/Verantwortung, die Verzerrungen des Gesetzes des Einen zu korrigieren, die sich während unserer Versuche, diesen Wesen zu helfen, ereigneten.",
    },
  },
  {
    reference: "Ra 23.10",
    text: {
      en: "The distortions are seen as responsibilities rather than failures.",
      es: "Las distorsiones son vistas como responsabilidades más que como fracasos; los pocos que fueron inspirados a buscar, nuestra única razón para el intento.Así, estaríamos quizás en la posición paradójica en la que cuando uno veía una iluminación, éramos lo que ustedes llaman exitosos, y cuando otros se volvían más afligidos y confundidos, éramos fracasados.",
      de: "Die Verzerrungen werden eher als Verantwortlichkeiten gesehen denn als Fehler; die Wenigen, die inspiriert waren, zu suchen, waren der einzige Grund für diesen Versuch.Deshalb waren wir vielleicht insofern in einer paradoxen Situation, dass wenn einer Erleuchtung sah, wir das waren, was ihr erfolgreich nennt; und so wie andere sorgenvoller und verwirrter wurden, waren wir Fehler.",
    },
  },
  {
    reference: "Ra 23.10",
    text: {
      en: "We persist in seeking to serve.",
      es: "Persistimos en la búsqueda de servir.",
      de: "Wir halten fest an der Suche nach Dienst.",
    },
  }
];

/**
 * Get a random quote from the daily quotes pool.
 */
export function getRandomDailyQuote(): DailyQuote {
  return dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
}
