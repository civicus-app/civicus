import type {
  AdminInsightsInput,
  AdminInsightsResult,
  AiServiceAdapter,
  ChatInput,
  ChatResult,
  CompleteVerificationInput,
  CompleteVerificationResult,
  ExtractInput,
  ExtractResult,
  StartVerificationInput,
  StartVerificationResult,
  TopicOverviewInput,
  TopicOverviewResult,
} from './types';

const topicBulletsNo: Record<string, string[]> = {
  'bedre-sykkelveier': [
    'Bedre sykkelveier i sentrale gater',
    'Tydeligere sykkelfelt og prioritering i kryss',
    'Tryggere ruter for skole og pendling',
  ],
  'flere-gronne-soner': [
    'Flere trerekker og regnbed i prosjektsonen',
    'Bedre luftkvalitet gjennom mindre biltrafikk',
    'Nye oppholdsrom med benker og beplantning',
  ],
  'budsjett-kostnad': [
    'Kostnadene fases i flere byggetrinn',
    'Mesteparten av finansieringen kommer fra kommunalt budsjett',
    'Lopende rapportering av framdrift og avvik',
  ],
  anleggsperioder: [
    'Anleggstid planlegges i avgrensede perioder',
    'Midlertidige omkjoringer blir tydelig skiltet',
    'Nattarbeid begrenses i boligomrader',
  ],
};

const topicBulletsEn: Record<string, string[]> = {
  'bedre-sykkelveier': [
    'Improved bike lanes in central streets',
    'Clearer cycle lanes and intersection priority',
    'Safer routes for school and commuting',
  ],
  'flere-gronne-soner': [
    'More tree lines and rain gardens in the project area',
    'Better air quality through reduced car traffic',
    'New public spaces with seating and greenery',
  ],
  'budsjett-kostnad': [
    'Costs are phased across multiple construction stages',
    'Most financing comes from municipal budget allocations',
    'Ongoing reporting of progress and deviations',
  ],
  anleggsperioder: [
    'Construction is planned in limited time windows',
    'Temporary detours are clearly signposted',
    'Night work is limited in residential areas',
  ],
};

const topicSummaryNo: Record<string, string> = {
  'bedre-sykkelveier':
    'Innspillene peker pa behov for bredere sykkelfelt og bedre separasjon mellom gaende og syklende.',
  'flere-gronne-soner':
    'Mange onsker flere gronne soner som reduserer stoy og gir et mer attraktivt bymiljo.',
  'budsjett-kostnad':
    'Det etterspors tydeligere informasjon om kostnadsrammer, prioriteringer og risiko for forsinkelser.',
  anleggsperioder:
    'Flere innbyggere ber om bedre varsling for stengte gater og mer detaljerte tidsplaner i anleggsperioden.',
};

const topicSummaryEn: Record<string, string> = {
  'bedre-sykkelveier':
    'Feedback indicates a need for wider bike lanes and better separation between pedestrians and cyclists.',
  'flere-gronne-soner':
    'Many residents want more green zones that reduce noise and create a more attractive city environment.',
  'budsjett-kostnad':
    'People are asking for clearer information on budget limits, priorities, and delay risks.',
  anleggsperioder:
    'Residents request better alerts for street closures and more detailed construction timelines.',
};

const topicExtractionNo: Record<string, string> = {
  'bedre-sykkelveier':
    'Utdrag: Kommunen prioriterer etablering av sammenhengende sykkelfelt i sentrumsaksen, med fokus pa trygg skolevei og helarsbruk.',
  'flere-gronne-soner':
    'Utdrag: Prosjektet inkluderer nye trerekker, overvannstiltak og mindre asfaltareal for a styrke byens gronne struktur.',
  'budsjett-kostnad':
    'Utdrag: Budsjettet deles i faser. Kommunen publiserer kvartalsvis status pa kostnader, fremdrift og avvik.',
  anleggsperioder:
    'Utdrag: Gjennomforing skjer i avgrensede delstrekninger for a redusere belastning for naboer og naeringsliv.',
};

const topicExtractionEn: Record<string, string> = {
  'bedre-sykkelveier':
    'Extract: The municipality prioritizes continuous bike lanes in the city core, with focus on safe school routes and year-round usability.',
  'flere-gronne-soner':
    'Extract: The project includes new tree lines, stormwater measures, and less asphalt to strengthen the green urban structure.',
  'budsjett-kostnad':
    'Extract: The budget is split into phases. The municipality publishes quarterly status on costs, progress, and deviations.',
  anleggsperioder:
    'Extract: Implementation is done in limited sections to reduce impact on residents and local businesses.',
};

const lastMessage = (messages: ChatInput['messages']) =>
  [...messages].reverse().find((message) => message.role === 'user')?.content || '';

const makeState = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `state-${Date.now()}`;
};

export class LocalMockAiAdapter implements AiServiceAdapter {
  async getTopicOverview(input: TopicOverviewInput): Promise<TopicOverviewResult> {
    const isEnglish = input.language === 'en';
    const bulletsMap = isEnglish ? topicBulletsEn : topicBulletsNo;
    return {
      bullets: bulletsMap[input.topic] || bulletsMap['bedre-sykkelveier'],
      citation: isEnglish ? 'Page 1.2, Paragraph 4' : 'Side 1.2, Avsnitt 4',
    };
  }

  async chat(input: ChatInput): Promise<ChatResult> {
    const prompt = lastMessage(input.messages).toLowerCase();
    const isEnglish = input.language === 'en';
    const summaryMap = isEnglish ? topicSummaryEn : topicSummaryNo;
    const base = summaryMap[input.topic] || summaryMap['bedre-sykkelveier'];

    if (prompt.includes('parkering')) {
      return {
        reply: isEnglish
          ? 'The municipality has stated that parking capacity is evaluated in each construction phase. Temporary spots may be added when needed.'
          : 'Kommunen har varslet at parkeringskapasitet vurderes i hvert byggetrinn. Midlertidige plasser kan opprettes ved behov.',
        citations: [isEnglish ? 'Section 3.1' : 'Seksjon 3.1'],
      };
    }

    return {
      reply: isEnglish
        ? `${base} We can also pull more detailed text from the original document if needed.`
        : `${base} Vi kan ogsa hente mer detaljert tekst fra originaldokumentet ved behov.`,
      citations: [isEnglish ? 'Section 1.3' : 'Seksjon 1.3'],
    };
  }

  async extractOriginalText(input: ExtractInput): Promise<ExtractResult> {
    const isEnglish = input.language === 'en';
    const extractionMap = isEnglish ? topicExtractionEn : topicExtractionNo;
    const summaryMap = isEnglish ? topicSummaryEn : topicSummaryNo;
    return {
      text: extractionMap[input.topic] || extractionMap['bedre-sykkelveier'],
      summary: summaryMap[input.topic] || summaryMap['bedre-sykkelveier'],
    };
  }

  async getAdminInsights(_input: AdminInsightsInput): Promise<AdminInsightsResult> {
    return {
      points: [
        'Flertallet av innspillene er positive til tryggere sykkellosninger.',
        'Bekymringer handler hovedsakelig om parkering og anleggstid.',
        'Brukerne ettersporr mer synlig informasjon om milepaeler og beslutninger.',
      ],
    };
  }

  async startVerification(input: StartVerificationInput): Promise<StartVerificationResult> {
    const state = makeState();
    const callback = new URL('/verifisering/callback', window.location.origin);
    callback.searchParams.set('state', state);
    callback.searchParams.set('code', `${input.provider}-mock-code`);
    callback.searchParams.set('policyId', input.policyId);

    return {
      redirectUrl: callback.toString(),
      state,
    };
  }

  async completeVerification(_input: CompleteVerificationInput): Promise<CompleteVerificationResult> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    return {
      verified: true,
      expiresAt,
    };
  }
}
