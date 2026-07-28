"use client";

import { useEffect, useState } from "react";

type PromptAnimationState = {
  characterCount: number;
  isDeleting: boolean;
  promptIndex: number;
};

export function HeroPromptDemo({ prompts }: { prompts: string[] }) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const [animation, setAnimation] = useState<PromptAnimationState>({
    characterCount: 0,
    isDeleting: false,
    promptIndex: 0,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setShouldReduceMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const currentPrompt = prompts[animation.promptIndex] ?? prompts[0] ?? "";

  useEffect(() => {
    if (shouldReduceMotion || prompts.length === 0) {
      return;
    }

    let delay = animation.isDeleting ? 18 : 34;
    let nextState: PromptAnimationState;

    if (!animation.isDeleting && animation.characterCount >= currentPrompt.length) {
      delay = 1600;
      nextState = { ...animation, isDeleting: true };
    } else if (animation.isDeleting && animation.characterCount === 0) {
      delay = 360;
      nextState = {
        characterCount: 0,
        isDeleting: false,
        promptIndex: (animation.promptIndex + 1) % prompts.length,
      };
    } else {
      nextState = {
        ...animation,
        characterCount: animation.characterCount + (animation.isDeleting ? -1 : 1),
      };
    }

    const timeout = window.setTimeout(() => setAnimation(nextState), delay);

    return () => window.clearTimeout(timeout);
  }, [animation, currentPrompt, prompts, shouldReduceMotion]);

  const visiblePrompt = shouldReduceMotion
    ? prompts[0] ?? ""
    : currentPrompt.slice(0, animation.characterCount);

  return (
    <div className="hero-prompt-demo min-h-14">
      <span className="sr-only">{prompts[0]}</span>
      <p aria-hidden="true" className="text-sm leading-6 sm:text-base sm:leading-7">
        {visiblePrompt}
        <span className="hero-prompt-caret" />
      </p>
    </div>
  );
}
