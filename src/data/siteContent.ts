import portraitSquare from "../assets/figures/portrait_square.jpeg";
import cvPdf from "../assets/files/CV-KangleMu-12-20.pdf";
import awardWiopt2024 from "../assets/figures/Award_WiOPT2024.jpeg";
import awardDyspan2024 from "../assets/figures/Award_DySPAN2024.jpeg";
import dyspan2025 from "../assets/figures/dyspan2025.jpeg";
import wioptReception from "../assets/figures/WiOpt_reception.jpeg";
import icc2024 from "../assets/figures/ICC2024.jpeg";
import iccCc from "../assets/figures/ICC_CC.jpeg";
import dyspanAward1 from "../assets/figures/DySpan2024_award1.jpg";
import dyspanAward2 from "../assets/figures/DySpan2024_award2.jpg";

import csvText from "./scholar_stats.csv?raw";

const [, dataRow] = csvText.trim().split("\n");
const [citations, hIndex, i10Index, updatedAt] = dataRow.split(",").map((v) => v.trim());

export const authorName = "Hi, I'm Phil";
export const scholarAuthorId = "3nL-yukAAAAJ";

export const profile = {
  subtitle: "PhD Candidate in Wireless Communications",
  cvUpdated: "Updated on Dec 20, 2025",
  portraitSquare,
  cvPdf,
  focusAreas: [
    "5G NR",
    "Wireless Spectrum Sharing",
    "Network Economics",
    "Game Theory",
    "Wireless Communications",
    "Reinforcement Learning",
  ],
};

export const stats = {
  citations,
  hIndex,
  i10Index,
  updatedAt,
};

export const awards = {
  awardWiopt2024,
  awardDyspan2024,
  awardLinks: {
    wiopt:
      "https://www.mccormick.northwestern.edu/electrical-computer/news-events/news/articles/2024/phd-students-win-best-student-paper-award-at-2024-wiopt-conference.html",
    dyspan:
      "https://www.mccormick.northwestern.edu/electrical-computer/news-events/news/articles/2024/phd-student-kangle-phil-mu-wins-best-paper-award-at-ieee-dyspan-2024.html",
  },
};

export const newsImages = {
  dyspan2025,
  wioptReception,
  icc2024,
  iccCc,
  dyspanAward1,
  dyspanAward2,
};

export const education = [
  {
    degree: "PhD, ECE — Northwestern University, IL, US",
    period: "Sept 2022 – Now",
  },
  {
    degree: "MS, ECE — University of Michigan, Ann Arbor, MI, US",
    period: "Aug 2020 – June 2022",
  },
  {
    degree: "BS, Telecommunications Engineering — Xidian University, China",
    period: "Sep 2016 – Jun 2020",
    gpa: "GPA: 3.90/4.00",
    highlight: "Graduated #1 in major (Class of 2020)",
  },
] as const;
