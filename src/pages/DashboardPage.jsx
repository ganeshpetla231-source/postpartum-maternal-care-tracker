import { Link, useSearchParams } from 'react-router-dom';

const units = [
  {
    number: '01',
    title: 'Your recovery',
    description: 'Make space for healing, rest and the questions that come with recovery.',
    tone: 'rose',
    chapters: [
      {
        id: 'healing-at-your-pace',
        title: 'Healing at your pace',
        readingTime: '3 min read',
        introduction:
          'Recovery after birth is personal. Your body, energy and emotions may change from day to day, and there is no single timetable you need to match.',
        sections: [
          {
            title: 'Notice what is changing',
            text: 'Pay attention to how you are feeling physically and emotionally. A short note can help you remember what has changed and what you would like to discuss with your care team.'
          },
          {
            title: 'Make rest part of the plan',
            text: 'Accepting practical help with meals, chores or baby care can make room for rest. Choose small, manageable steps and let your care team guide activity that is right for you.'
          }
        ],
        reflection: 'What is one thing you could let someone else help with today?',
        action: { label: 'Open my care plan', path: '/recovery' }
      },
      {
        id: 'body-signals',
        title: 'Listening to body signals',
        readingTime: '3 min read',
        introduction:
          'Noticing and describing symptoms can make conversations with your care team clearer. You do not need to decide on your own what a symptom means.',
        sections: [
          {
            title: 'Keep useful details together',
            text: 'If something concerns you, note when it began, whether it is changing, and any questions you want to ask. Share those details with your clinician rather than relying on a checklist or comparison with someone else.'
          },
          {
            title: 'Reach out when unsure',
            text: 'Contact your maternity care team for guidance about symptoms or recovery concerns. If you think you or your baby may be in immediate danger, contact local emergency services.'
          }
        ],
        reflection: 'Is there a recovery question you want to bring to your next appointment?',
        action: { label: 'View my care team', path: '/escalations' }
      }
    ]
  },
  {
    number: '02',
    title: 'Feeding & baby rhythms',
    description: 'Keep feeding support, baby observations and everyday notes in one place.',
    tone: 'sage',
    chapters: [
      {
        id: 'feeding-support',
        title: 'Finding feeding support',
        readingTime: '3 min read',
        introduction:
          'Feeding a baby can involve learning, adjustment and support. Your feeding plan can be discussed with a clinician or lactation professional who understands your situation.',
        sections: [
          {
            title: 'Ask for help that fits you',
            text: 'You can bring questions about comfort, feeding choices or practical routines to your care team. If you would like specialist help, ask about a lactation consultant or other local feeding support.'
          },
          {
            title: 'Keep track without pressure',
            text: 'A simple log can help you recall feeding patterns when you speak with a professional. Use it as a memory aid, not as a measure of whether you are doing enough.'
          }
        ],
        reflection: 'What would make feeding feel a little more supported right now?',
        action: { label: 'Find lactation support', path: '/lactation' }
      },
      {
        id: 'baby-observations',
        title: 'Noticing your baby’s rhythms',
        readingTime: '3 min read',
        introduction:
          'In the early weeks, recording small observations can help you and your care team talk about your baby’s day. Every baby is different, so use professional guidance for questions about your baby.',
        sections: [
          {
            title: 'Choose the details that help',
            text: 'You might record feeds, sleep or diaper changes to help you remember patterns. Keep notes simple enough to fit into your day, and share concerns with your baby’s clinician.'
          },
          {
            title: 'Let the log serve you',
            text: 'A log is a tool for noticing and communicating; it is not a test. If tracking starts to feel stressful, ask your care team what information is most useful for your family.'
          }
        ],
        reflection: 'Which one detail would be most useful to remember today?',
        action: { label: 'Open baby logs', path: '/babies' }
      }
    ]
  },
  {
    number: '03',
    title: 'Emotional wellbeing',
    description: 'Check in with yourself and learn how to reach out for emotional support.',
    tone: 'lavender',
    chapters: [
      {
        id: 'mood-and-support',
        title: 'Making room for your feelings',
        readingTime: '3 min read',
        introduction:
          'The postpartum period can bring many feelings, sometimes changing quickly. You deserve support with your emotional wellbeing as well as your physical recovery.',
        sections: [
          {
            title: 'A check-in is a starting point',
            text: 'Taking a moment to notice how you feel can help you decide what support would be helpful. You do not need to wait until things feel overwhelming to talk with someone you trust or your care team.'
          },
          {
            title: 'You are not expected to manage alone',
            text: 'Consider telling a trusted person what has felt difficult and what kind of help you need. A healthcare professional can help you talk through ongoing or worrying feelings.'
          }
        ],
        reflection: 'Who is one person you could tell how you are really feeling?',
        action: { label: 'Take a wellbeing check-in', path: '/#screening' }
      },
      {
        id: 'screening-and-next-steps',
        title: 'Screening and next steps',
        readingTime: '3 min read',
        introduction:
          'A wellbeing questionnaire can help start a conversation, but it cannot diagnose you or replace a conversation with a healthcare professional.',
        sections: [
          {
            title: 'Answer for yourself',
            text: 'If you choose to complete a screening, answer as honestly as you can. The result is one piece of information to discuss with a qualified professional, not a judgment about you as a parent.'
          },
          {
            title: 'Reach out for urgent help',
            text: 'If you are worried about your safety or someone else’s safety, contact local emergency services or a crisis service now, and tell a trusted person who can stay with you.'
          }
        ],
        reflection: 'What would help you feel comfortable asking for support?',
        action: { label: 'Open wellbeing screening', path: '/#screening' }
      }
    ]
  },
  {
    number: '04',
    title: 'Your circle of care',
    description: 'Bring your questions, appointments and support people together.',
    tone: 'sand',
    chapters: [
      {
        id: 'sharing-the-load',
        title: 'Sharing the load',
        readingTime: '2 min read',
        introduction:
          'Support can be practical as well as emotional. Being specific about what would help can make it easier for family or friends to show up for you.',
        sections: [
          {
            title: 'Ask for a concrete task',
            text: 'You might ask someone to bring a meal, pick up supplies or spend time with the baby while you rest. Choose what feels comfortable and set boundaries around the support you want.'
          },
          {
            title: 'Share only what feels right',
            text: 'If you use family sharing tools, review what information is shared and with whom. Your health details are personal, and you can decide what support people are allowed to see.'
          }
        ],
        reflection: 'What is one specific task you would feel comfortable asking someone to do?',
        action: { label: 'Review family sharing', path: '/family' }
      },
      {
        id: 'appointments-and-questions',
        title: 'Getting ready for appointments',
        readingTime: '2 min read',
        introduction:
          'Appointments are a chance to ask about your recovery, your baby and the support available to you. You can bring notes or ask someone you trust to join you.',
        sections: [
          {
            title: 'Write down what matters to you',
            text: 'Before a visit, note your main questions and any changes you want to mention. If time is limited, start with the concern that feels most important.'
          },
          {
            title: 'Leave with a clear next step',
            text: 'Ask who to contact if a new question comes up, and make sure you understand the next step in your care plan. It is okay to ask for information to be repeated or explained another way.'
          }
        ],
        reflection: 'What is the first question you would like answered at your next visit?',
        action: { label: 'Manage my reminders', path: '/reminders' }
      }
    ]
  }
];

const chapters = units.flatMap((unit) =>
  unit.chapters.map((chapter) => ({ ...chapter, unit }))
);

const toneClasses = {
  rose: {
    badge: 'bg-white text-black ring-1 ring-black/10',
    border: 'border-black/10',
    panel: 'bg-transparent',
    number: 'text-black'
  },
  sage: {
    badge: 'bg-white text-black ring-1 ring-black/10',
    border: 'border-black/10',
    panel: 'bg-transparent',
    number: 'text-black'
  },
  lavender: {
    badge: 'bg-white text-black ring-1 ring-black/10',
    border: 'border-black/10',
    panel: 'bg-transparent',
    number: 'text-black'
  },
  sand: {
    badge: 'bg-white text-black ring-1 ring-black/10',
    border: 'border-black/10',
    panel: 'bg-transparent',
    number: 'text-black'
  }
};

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChapter = chapters.find(
    (chapter) => chapter.id === searchParams.get('chapter')
  );

  function showContents() {
    setSearchParams({});
  }

  function openChapter(id) {
    setSearchParams({ chapter: id });
  }

  function moveChapter(offset) {
    const currentIndex = chapters.findIndex((chapter) => chapter.id === selectedChapter.id);
    const nextChapter = chapters[currentIndex + offset];
    if (nextChapter) openChapter(nextChapter.id);
  }

  return (
    <div className={`dashboard-page mx-auto max-w-6xl p-4 sm:p-6 ${selectedChapter ? 'dashboard-page--chapter' : ''}`}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black">
            Your postpartum guide
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            {selectedChapter ? selectedChapter.title : 'My care notebook'}
          </h1>
        </div>
        {selectedChapter && (
          <button
            type="button"
            onClick={showContents}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 text-sm font-semibold text-black transition hover:bg-white"
          >
            <span aria-hidden="true">←</span> Contents
          </button>
        )}
      </header>

      {!selectedChapter ? (
        <>
          <section className="relative overflow-hidden rounded-[1.75rem] border border-black/10 bg-transparent p-6 shadow-none sm:p-9">
            <div className="relative z-10 max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-black">
                <span aria-hidden="true">✦</span> A gentle guide for the fourth trimester
              </p>
              <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-black sm:text-4xl">
                One page, one moment, one step at a time.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-black/80 sm:text-base">
                Browse short chapters on recovery, baby care and finding support. Come back to
                any page whenever it feels useful—there is no schedule to keep.
              </p>
              <button
                type="button"
                onClick={() => openChapter(chapters[0].id)}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black/80"
              >
                Start reading <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="pointer-events-none absolute -right-12 -top-16 hidden h-72 w-72 rounded-full border border-black/10 bg-white/30 sm:block" />
            <div className="pointer-events-none absolute -bottom-20 right-14 hidden h-56 w-56 rounded-full border border-black/10 bg-white/20 sm:block" />
            <div className="absolute bottom-5 right-7 hidden rotate-3 rounded-xl border border-black/10 bg-white/80 p-4 text-center shadow-none sm:block">
              <span className="block text-3xl text-black" aria-hidden="true">♡</span>
              <span className="mt-1 block text-xs font-semibold text-black/70">
                {units.length} units · {chapters.length} chapters
              </span>
            </div>
          </section>

          <section className="dashboard-contents mt-8" aria-labelledby="notebook-contents">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">
                  The contents
                </p>
                <h2 id="notebook-contents" className="mt-1 text-2xl font-semibold text-black">
                  Choose a unit
                </h2>
              </div>
              <span className="text-sm text-black/70">Read in any order</span>
            </div>

            <div className="space-y-4">
              {units.map((unit) => (
                <section
                  key={unit.number}
                  aria-labelledby={`unit-${unit.number}`}
                  className={`dashboard-unit-card overflow-hidden rounded-2xl border shadow-none ${toneClasses[unit.tone].panel} ${toneClasses[unit.tone].border}`}
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold ${toneClasses[unit.tone].badge}`}
                      aria-label={`Unit ${Number(unit.number)}`}
                    >
                      {unit.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 id={`unit-${unit.number}`} className="text-lg font-semibold text-black">
                          Unit {Number(unit.number)} · {unit.title}
                        </h3>
                        <span className="text-xs font-medium text-black/70">
                          {unit.chapters.length} chapters
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-black/75">{unit.description}</p>
                      <ol className="mt-4 divide-y divide-black/10">
                        {unit.chapters.map((chapter, chapterIndex) => (
                          <li key={chapter.id}>
                            <button
                              type="button"
                              onClick={() => openChapter(chapter.id)}
                              className="group flex w-full items-center gap-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                            >
                              <span className={`w-8 shrink-0 text-xs font-bold ${toneClasses[unit.tone].number}`}>
                                {unit.number}.{chapterIndex + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium text-black group-hover:text-black">
                                  {chapter.title}
                                </span>
                                <span className="mt-0.5 block text-xs text-black/70">
                                  {chapter.readingTime}
                                </span>
                              </span>
                              <span className="text-lg text-black transition-transform group-hover:translate-x-1" aria-hidden="true">
                                →
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="mt-6 rounded-2xl border border-black/10 bg-transparent p-4 text-sm leading-6 text-black/80">
            This notebook offers general information, not personal medical advice. Your own care
            team can guide decisions about you and your baby. If you think you or your baby may be
            in immediate danger, contact local emergency services.
          </aside>
        </>
      ) : (
        <article className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-transparent shadow-none">
          <div className="border-b border-black/10 bg-transparent px-5 py-4 sm:px-8">
            <p className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.13em] ${toneClasses[selectedChapter.unit.tone].badge}`}>
              Unit {Number(selectedChapter.unit.number)} · {selectedChapter.unit.title}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-black/70">{selectedChapter.readingTime}</p>
              <p className="text-sm font-medium text-black/70">
                Chapter {chapters.findIndex((chapter) => chapter.id === selectedChapter.id) + 1} of {chapters.length}
              </p>
            </div>
          </div>

          <div className="relative px-5 py-7 sm:px-10 sm:py-9">
            <div className="pointer-events-none absolute bottom-0 left-9 top-0 hidden border-l border-black/10 sm:block" />
            <div className="relative sm:pl-8">
              <p className="text-lg leading-8 text-black/80">{selectedChapter.introduction}</p>
              <div className="mt-7 space-y-7">
                {selectedChapter.sections.map((section, index) => (
                  <section key={section.title} className="border-b border-dashed border-black/10 pb-6 last:border-0">
                    <h2 className="flex items-baseline gap-3 text-lg font-semibold text-black">
                      <span className={`text-sm font-bold ${toneClasses[selectedChapter.unit.tone].number}`}>
                        0{index + 1}
                      </span>
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-black/75 sm:text-base">
                      {section.text}
                    </p>
                  </section>
                ))}
              </div>

              <aside className="dashboard-reflection mt-2 rounded-2xl border p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-black">
                  A moment to reflect
                </p>
                <p className="mt-2 text-base font-medium leading-7 text-black">
                  {selectedChapter.reflection}
                </p>
                <p className="mt-2 text-xs text-black/70">
                  Take this prompt with you, or leave it for another day. Nothing is saved here.
                </p>
              </aside>

              <div className="mt-6 rounded-2xl border border-black/10 bg-transparent p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-black">
                    Put it into practice
                  </p>
                  <p className="mt-1 text-sm text-black/75">
                    Continue with a tool in your care space, whenever you are ready.
                  </p>
                </div>
                <Link
                  to={selectedChapter.action.path}
                  className="mt-4 inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-black transition hover:bg-black/5 sm:mt-0"
                >
                  {selectedChapter.action.label} <span className="ml-2" aria-hidden="true">→</span>
                </Link>
              </div>

              <nav aria-label="Chapter navigation" className="mt-8 flex items-center justify-between gap-3 border-t border-black/10 pt-5">
                <button
                  type="button"
                  onClick={() => moveChapter(-1)}
                  disabled={chapters[0].id === selectedChapter.id}
                  className="min-h-10 rounded-full px-3 text-sm font-semibold text-black hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={showContents}
                  className="min-h-10 rounded-full px-3 text-sm font-semibold text-black hover:bg-black/5"
                >
                  Contents
                </button>
                <button
                  type="button"
                  onClick={() => moveChapter(1)}
                  disabled={chapters[chapters.length - 1].id === selectedChapter.id}
                  className="min-h-10 rounded-full px-3 text-sm font-semibold text-black hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </nav>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}

export default DashboardPage;
