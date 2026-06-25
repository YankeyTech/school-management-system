import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { studentName, subjectScores, overallAverage, className, termName } = await req.json();

  const prompt = `Generate a professional, encouraging report card comment for a Ghanaian school student with the following details:

Student Name: ${studentName}
Class: ${className}
Term: ${termName}
Overall Average: ${overallAverage}%

Subject Scores:
${subjectScores.map((s: { subject: string; score: number; grade: string }) =>
  `- ${s.subject}: ${s.score}% (${s.grade})`
).join('\n')}

Generate THREE separate sections:
1. STRENGTHS (2-3 bullet points about what the student is doing well)
2. AREAS FOR IMPROVEMENT (2-3 bullet points of constructive feedback)  
3. TEACHER'S COMMENT (2-3 sentences, professional and encouraging, suitable for a Ghanaian school report card)

Format your response as JSON with keys: strengths (array), weaknesses (array), overall_comment (string)`;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Return sample for development
      return NextResponse.json({
        strengths: [
          `Shows excellent understanding of core concepts`,
          `Demonstrates consistent effort and dedication to learning`,
          `Actively participates in class activities and discussions`,
        ],
        weaknesses: [
          `Needs to improve time management during examinations`,
          `Should spend more time reviewing difficult topics`,
          `Practice of past questions would improve performance further`,
        ],
        overall_comment: `${studentName} has shown commendable dedication throughout the term and achieved an overall average of ${overallAverage}%. With continued effort and focus on the identified areas for improvement, ${studentName.split(' ')[0]} is well-positioned for even greater success in the coming term. Keep up the good work!`,
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://educore.app',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to generate comment', details: err.message },
      { status: 500 }
    );
  }
}
