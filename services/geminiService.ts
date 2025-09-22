import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GroundingChunk, AnalysisSection, Framework } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface StructuredSourceInfo {
    reportName: string;
    publicationDate: string | null;
}

export async function extractSourceMetadata(sources: GroundingChunk[]): Promise<StructuredSourceInfo[]> {
    if (sources.length === 0) return [];
    try {
        const prompt = `You are an expert data extraction model. Your task is to analyze a list of research report titles and extract two key pieces of information: the official "report name" and the "publication date".

        **Input:**
        You will be given a JSON array of source objects, where each object has a "title" and a "uri".

        **Instructions:**
        1.  **Report Name Extraction:**
            -   Identify the core title of the research report.
            -   Remove any extraneous information like publisher names (e.g., "中信证券", "Goldman Sachs"), dates, file types (e.g., ".pdf"), or general website names.
            -   The goal is to get the cleanest, most specific title of the document itself.
        2.  **Publication Date Extraction:**
            -   Find the publication date within the title or infer it.
            -   Standardize the date to a 'YYYY-MM-DD' format if possible. If only year and month are available, use 'YYYY-MM'. If only the year, use 'YYYY'.
            -   If no date can be reliably found, the value should be \`null\`.

        **Input Data:**
        ${JSON.stringify(sources.map(s => s.web), null, 2)}

        **Output Format:**
        Return a valid JSON array that has the exact same number of objects as the input array. Each object must contain two keys:
        -   \`reportName\`: The cleaned report title (string).
        -   \`publicationDate\`: The extracted date (string in YYYY-MM-DD format or similar) or \`null\`.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            reportName: { type: Type.STRING, description: "The cleaned, specific title of the report." },
                            publicationDate: { type: Type.STRING, description: "The publication date (YYYY-MM-DD) or null.", nullable: true }
                        },
                        required: ["reportName", "publicationDate"]
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error extracting source metadata from Gemini API:", error);
        // Fallback: return raw titles if metadata extraction fails
        return sources.map(s => ({ reportName: s.web.title, publicationDate: null }));
    }
}


export async function suggestFrameworks({topic, objective, scope}: {topic: string; objective: string; scope: string;}): Promise<Framework[]> {
    try {
        const prompt = `You are a top-tier consultant from a leading industry analysis firm. Your client has defined their research project as follows:
- Topic: "${topic}"
- Research Objective: "${objective}"
${scope ? `- Scope: "${scope}"` : ''}

Based on this complete definition, devise 3 to 5 highly relevant, bespoke, and insightful analysis frameworks that would provide a comprehensive understanding of the subject. Do not suggest generic, textbook frameworks like a junior analyst would (e.g., SWOT, PESTEL, Porter's Five Forces unless they are exceptionally well-justified for this specific context). These frameworks should be practical and directly address the client's stated objective and scope.

For each custom framework, provide:
1. A name in Traditional Chinese ("name_zh").
2. A name in English ("name_en").
3. A brief, compelling description in Traditional Chinese of its advantages and how it specifically helps achieve the research objective ("advantage").

Your response must be a JSON array of objects, with the keys "name_zh", "name_en", and "advantage".`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name_zh: { type: Type.STRING, description: "The name of the framework in Traditional Chinese." },
                            name_en: { type: Type.STRING, description: "The name of the framework in English." },
                            advantage: { type: Type.STRING, description: "A brief description in Traditional Chinese of the framework's advantages or best use case." }
                        },
                        required: ["name_zh", "name_en", "advantage"]
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error suggesting frameworks from Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to suggest frameworks: ${error.message}`);
        }
        throw new Error("An unknown error occurred while suggesting frameworks.");
    }
}

function parseMarkdownReport(text: string): { overallSummary: string, analysis: AnalysisSection[] } {
    const summaryMatch = text.match(/##\s*綜合摘要\s*([\s\S]*?)(?=\n###\s*|$)|##\s*Overall Summary\s*([\s\S]*?)(?=\n###\s*|$)/i);
    const overallSummary = summaryMatch ? (summaryMatch[1] || summaryMatch[2] || '').trim() : '';

    const analysis: AnalysisSection[] = [];
    const sectionRegex = /###\s*([^#\n\r]+)\s*([\s\S]*?)(?=\n###\s*|$)/g;
    
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
        let content = match[2].trim();
        let sources: string | undefined = undefined;

        // Regex to find and remove the source summary line.
        const sourceLineRegex = /\n*SECTION_SOURCES:(\s*\[[\d\s,]+\])$/m;
        const sourceMatch = content.match(sourceLineRegex);
        
        if (sourceMatch) {
            sources = sourceMatch[1].trim(); // e.g., "[1, 4, 5]"
            content = content.replace(sourceLineRegex, '').trim(); // remove it from main content
        }

        analysis.push({
            title: match[1].trim(),
            content: content,
            sources: sources,
        });
    }

    if (!overallSummary && analysis.length === 0 && text.length > 0) {
        return { overallSummary: text.trim(), analysis: [] };
    }

    return { overallSummary, analysis };
}


export async function generateReportStream({
    topic, 
    framework, 
    onStreamUpdate,
    onStreamEnd,
    signal
}: {
    topic: string;
    framework: string;
    onStreamUpdate: (chunk: string) => void;
    onStreamEnd: (sources: GroundingChunk[]) => void;
    signal: AbortSignal;
}) {
  try {
    const prompt = `
      As a senior industry analyst, generate a detailed report in Traditional Chinese on the topic "${topic}" using the "${framework}" framework.

      Your primary task is to APPLY the framework to the topic to produce a comprehensive research report. Do not simply describe what the framework is.

      For your analysis, you MUST ground your research and find at least 15 sources. The source citations must come from three specific directions:
      1. Crawled web brokerage reports (爬蟲網路券商報告).
      2. Official websites of major consulting or industry analysis firms (各大顧問或是產業分析公司官網).
      3. Various types of media and official websites (各種類型媒體以及官方網站).

      Fulfilling this requirement for at least 15 diverse sources is critical.

      Organize your response in Markdown with the following structure: 
      - A main "## 綜合摘要" section with a concise summary. Use bullet points for key insights.
      - Then, create a section for each component of the framework using "###" headers (e.g., "### 優勢", "### 劣勢").
      - Provide detailed bullet points under each section.
      
      **Mandatory Citation and Source Summary Rules:**
      1.  **Inline Citations:** After every key statement, paragraph, or bullet point, you MUST add citation markers referencing the sources you used. The sources are numbered starting from 1. Format citations as \`[1]\`, \`[2, 3]\`, or \`[4-6]\`.
      2.  **Section Source Summary:** At the very end of EACH analysis section (under each "###" header), you MUST include a source summary line.
          -   This line MUST be the absolute last line of the section.
          -   The format MUST be exactly: \`SECTION_SOURCES: [numbers]\`, for example, \`SECTION_SOURCES: [1, 4, 5]\`.
          -   The numbers inside the brackets MUST correspond to the inline citations used within that section.
          -   **This field cannot be empty.** You must list at least one source for every section. Failure to follow this rule will result in an invalid response.

      **IMPORTANT FORMATTING RULES:**
      - Your entire response must be in Traditional Chinese.
      - Strictly follow the Markdown structure specified.
      - **Do not use markdown bolding (e.g., \`**text**\`).** Use clear topic sentences instead of bolded keywords.
      - Do not list source URLs in your summary text. The citations are numbers only.
    `;

    const stream = await ai.models.generateContentStream({
       model: "gemini-2.5-flash",
       contents: prompt,
       config: {
         tools: [{googleSearch: {}}],
         temperature: 0.2,
       },
    });

    let fullResponse: GenerateContentResponse | null = null;
    for await (const chunk of stream) {
        if (signal.aborted) {
            console.log("Stream aborted by user.");
            break;
        }
        onStreamUpdate(chunk.text);
        fullResponse = chunk; // Keep track of the last chunk for metadata
    }
    
    const groundingChunks = fullResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    const validSources = groundingChunks.filter(chunk => chunk.web && chunk.web.uri && chunk.web.title);
    onStreamEnd(validSources);

  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error generating report from Gemini API:", error);
        throw new Error(`Failed to generate report: ${error.message}`);
    } else {
        throw new Error("An unknown error occurred while generating report.");
    }
  }
}

export { parseMarkdownReport };