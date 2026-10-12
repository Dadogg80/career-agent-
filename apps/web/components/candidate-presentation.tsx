"use client";
import type {Locale} from "../lib/translations";
import {SelectedPresentation} from "./presentation-selection";

/** The profile shows explicitly selected wording; draft summaries remain in source review. */
export function CandidatePresentation({locale,onReviewDocuments}:{locale:Locale;csrfToken:string;onAuthRequired:()=>void;onReviewDocuments:()=>void}){
 return <SelectedPresentation locale={locale} onReviewDocuments={onReviewDocuments}/>;
}
