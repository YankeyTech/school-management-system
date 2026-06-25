import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are EduCore AI, an intelligent school management assistant for Ghanaian schools.

You help school administrators, teachers, parents, and students with:
- Generating professional report card comments based on student scores
- Analyzing student performance trends and providing insights
- Drafting parent communications, notices, and announcements  
- Creating study plans and academic schedules
- Answering questions about school management best practices
- Providing recommendations for improving academic outcomes

Context:
- You work with Ghanaian schools (primary, secondary, SHS, and tertiary)
- The local currency is Ghana Cedis (₵/GHS)
- Common grading: A1 (80-100), B2 (70-79), B3 (65-69), C4-C6 (50-64), D7-E8 (40-49), F9 (0-39)
- Key exams: BECE (JHS), WASSCE (SHS)
- Academic calendar: 3 terms per year, starting September

Guidelines:
- Be professional, concise, and helpful
- Use encouraging but honest language for student comments
- Format responses clearly with bullet points when listing items
- Keep report card comments between 2-4 sentences
- Always be culturally sensitive to the Ghanaian context`;

export async function POST(req: NextRequest) {
  try {
    const { message, history, schoolId, userRole } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Fallback mock response for development
      return NextResponse.json({
        message: generateMockResponse(message),
      });
    }

    // Build messages array with history
    const chatMessages = [
      ...history.slice(-8).map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://educore.app',
        'X-Title': 'EduCore School Management System',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku', // Free tier on OpenRouter
        messages: chatMessages,
        system: SYSTEM_PROMPT,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content ?? 'No response generated';

    return NextResponse.json({ message: aiMessage });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return NextResponse.json(
      { message: generateMockResponse('') },
      { status: 200 } // Return mock instead of error for UX
    );
  }
}

function generateMockResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('report') || lower.includes('comment')) {
    return `**Report Card Comment (Sample):**\n\nKwame has demonstrated commendable effort throughout this term and shown steady improvement in core subjects. His dedication to Mathematics is particularly noteworthy, earning him a well-deserved B2. With continued focus and regular review of Science concepts, he is well-positioned to achieve excellent results in the upcoming examinations.\n\n*Configure your OpenRouter API key to enable live AI generation.*`;
  }

  if (lower.includes('attendance')) {
    return `**Attendance Improvement Strategies:**\n\n• Implement an automated SMS alert system to notify parents of absences within 2 hours\n• Create an attendance leaderboard per class to encourage healthy competition\n• Introduce a perfect attendance certificate at end of each term\n• Conduct home visits for students with more than 3 consecutive absences\n• Engage class prefects as attendance monitors to take morning roll call\n\n*Configure your OpenRouter API key to enable live AI responses.*`;
  }

  if (lower.includes('bece') || lower.includes('wassce') || lower.includes('exam')) {
    return `**BECE Preparation Plan:**\n\n**3 Months Before:**\n• Complete all syllabus topics by end of month 1\n• Begin mock exams in month 2, weekly tests in all 8 subjects\n• Focus revision on weak areas identified from mock results\n\n**Key Subjects to Prioritize:**\n• Mathematics — computation and word problems\n• English Language — composition and comprehension\n• Integrated Science — past paper patterns\n\n**Study Schedule:** 3-4 hours daily, rotating subjects each day.\n\n*Configure your OpenRouter API key to enable live AI generation.*`;
  }

  return `Thank you for your question! I'm ready to assist with school management tasks including:\n\n• **Report card comments** — provide a student's marks and I'll generate professional comments\n• **Performance analysis** — share attendance or results data for insights\n• **Parent communications** — describe the situation and I'll draft a letter\n• **Academic planning** — exam schedules, study plans, timetables\n\n*Note: Configure OPENROUTER_API_KEY in your environment to enable full AI capabilities.*`;
}
