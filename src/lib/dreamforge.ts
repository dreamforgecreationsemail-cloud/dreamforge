import music from "@/assets/mode-music.jpg";
import picture from "@/assets/mode-picture.jpg";
import video from "@/assets/mode-video.jpg";
import brainstorm from "@/assets/mode-brainstorm.jpg";
import marketing from "@/assets/mode-marketing.jpg";
import teacher from "@/assets/mode-teacher.jpg";
import money from "@/assets/mode-money.jpg";
import kids from "@/assets/mode-kids.jpg";
import bigUnk from "@/assets/crew-big-unk.png";
import goGetta from "@/assets/crew-go-getta.png";
import getErDone from "@/assets/crew-get-er-done.png";

export type ModeId = "music" | "picture" | "video" | "brainstorm" | "marketing" | "teacher" | "money" | "kids";

export interface Mode {
  id: ModeId;
  title: string;
  tag: string;
  img: string;
  lanes: { name: string; detail: string }[];
}

// Seven core modes. Brainstormer is the center block. Kids Factory is a
// separate build that comes after Jack's personal version — never merged.
export const MODES: Mode[] = [
  { id: "music", title: "Music", tag: "Talk out a song", img: music, lanes: [
    { name: "Guided Song Talk", detail: "Asks: what kind of song, feeling, vibe, love, rap, upbeat, laid back, genre, artist style. Then walks you through hook, loops, words and the name." },
    { name: "Forge Beat Maker", detail: "Jack's own beat engine, inside the app. Lay a bass first, then stack prompts on top — unlimited layers." },
    { name: "Voice Capture", detail: "Sing a few lines to capture your voice for the whole song. Auto-tune dial up or down so it still sounds like you." },
    { name: "Song For Someone", detail: "Build a song for someone else from samples of their voice." },
  ]},
  { id: "picture", title: "Picture", tag: "Three lanes, mix them", img: picture, lanes: [
    { name: "Cartoon + Anime", detail: "One lane for both styles." },
    { name: "Realistic", detail: "Photo-real builds." },
    { name: "Portrait + Social", detail: "Guided by what's trending. Social picture and funny picture of the day." },
    { name: "Drop Your Photo", detail: "Drag a photo in and build on it. Lanes can be mixed." },
  ]},
  { id: "video", title: "Video", tag: "One mode, every style", img: video, lanes: [
    { name: "Style Mixer", detail: "Cartoon + anime, realistic, AI animated, or a real person acting — focus one or mix." },
    { name: "Commercial + Ads", detail: "Ads live here. Before sending, pulls the current rules for the target platform (Facebook, etc.)." },
  ]},
  { id: "brainstorm", title: "Brainstormer", tag: "Your thinking partner", img: brainstorm, lanes: [
    { name: "Project Notes", detail: "Keeps a copy of everything, sorted by project and mode." },
    { name: "Talk It Through", detail: "Works through projects with you and the crew council." },
    { name: "Real Talk", detail: "Vent freely. Never goes into bills or projects, but stays in memory so it knows who you are." },
  ]},
  { id: "marketing", title: "Marketing", tag: "Funnel + social", img: marketing, lanes: [
    { name: "Profile Funnel", detail: "Turns your profile into a funnel." },
    { name: "Social Expert", detail: "Plans posts and ads per platform." },
    { name: "Done Tracker", detail: "Tracks when things are done and controls the backend." },
  ]},
  { id: "teacher", title: "Teacher", tag: "Silent researcher", img: teacher, lanes: [
    { name: "Background Research", detail: "Researches quietly, tracks where AI is moving." },
    { name: "Progress Lessons", detail: "Teaches what changed." },
    { name: "Safety Interject", detail: "Speaks up only if something is wrong or for production safety." },
  ]},
  { id: "money", title: "Money", tag: "Banker + auditor", img: money, lanes: [
    { name: "Grants + Funding", detail: "Tracks grants, funding and when money comes in." },
    { name: "What Makes What", detail: "Shows which project earns what." },
    { name: "Price Calculator", detail: "Undercuts competitors while keeping good profit. Original work sets its own price." },
  ]},
];

export const KIDS: Mode = { id: "kids", title: "Kids Factory", tag: "Separate build — after Jack's", img: kids, lanes: [
  { name: "Coming after Jack's version", detail: "Its own factory version. Not merged with the personal build." },
]};

export interface Crew { id: string; name: string; role: string; img?: string; hair: string; awaiting?: string }

export const CREW: Crew[] = [
  { id: "dream", name: "DREAM", role: "Talker", hair: "Long dark wavy hair", awaiting: "Waiting on Dream's photo" },
  { id: "nyna", name: "Nyna", role: "Voice of reason", hair: "Long dark curly hair", awaiting: "Waiting on Nyna's photo" },
  { id: "unk", name: "Big Unk", role: "Builder + protector", img: bigUnk, hair: "Little fro under the D hat" },
  { id: "getta", name: "Go Getta", role: "Speed", img: goGetta, hair: "Cornrows" },
  { id: "done", name: "Get'er Done", role: "Master builder + costs", img: getErDone, hair: "Big blond mullet" },
  { id: "jack", name: "Jack", role: "Founder", hair: "—", awaiting: "Photo to come" },
];

// Council skit — rolls out line by line during a build.
export const SKIT: { who: string; line: string }[] = [
  { who: "unk", line: "Alright. Chairs down. We building." },
  { who: "dream", line: "Finally. I've been dressed for an hour." },
  { who: "nyna", line: "Quick check — that's two vibes. Pick one." },
  { who: "getta", line: "Already picked. Moving." },
  { who: "done", line: "Hold up, son. That costs less if we stack it." },
  { who: "unk", line: "Listen to the man. Then go." },
  { who: "nyna", line: "Numbers check out. We're clean." },
  { who: "dream", line: "Told you we're on Jack's team." },
];
