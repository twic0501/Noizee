import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '../../utils/helpers';
import './FuzzyText.css'; // Tạo file CSS này

const FuzzyText = ({
  text: textProp,
  textKey,
  as: Component = 'span',
  className,
  revealDelay = 100,
  charRevealInterval = 50,
  fuzzyAnimDurationPerChar = 30, // Tốc độ fuzzy cho mỗi ký tự (tổng thời gian fuzzy = fuzzyAnimDurationPerChar * maxFuzzyCharsPerIteration)
  maxFuzzyCharsPerIteration = 5,
  randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*&%$#@!',
}) => {
  const { t } = useTranslation();
  const textToReveal = useMemo(() => textKey ? t(textKey, textProp) : textProp || '', [t, textKey, textProp]);

  const [displayedText, setDisplayedText] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const hasStartedRef = useRef(false); // Track if animation has started to prevent re-trigger on re-renders
  const timeoutsRef = useRef([]); // Store all timeouts for cleanup

  useEffect(() => {
    // Initialize with non-breaking spaces to reserve layout space
    setDisplayedText('\u00A0'.repeat(textToReveal.length || 10)); // Default to 10 spaces if no text yet

    if (!textToReveal || hasStartedRef.current) return;

    const mainStartTimeout = setTimeout(() => {
      hasStartedRef.current = true;
      setIsRevealing(true);
      let currentRevealedChars = Array(textToReveal.length).fill('\u00A0'); // Start with placeholders

      textToReveal.split('').forEach((trueChar, charIndex) => {
        const charRevealTimeout = setTimeout(() => {
          if (trueChar === ' ') {
            currentRevealedChars[charIndex] = ' ';
            setDisplayedText(currentRevealedChars.join(''));
            if (charIndex === textToReveal.length - 1) setIsRevealing(false);
            return;
          }

          let fuzzyIteration = 0;
          let animationFrameId;

          const animateFuzzyChar = () => {
            if (fuzzyIteration < maxFuzzyCharsPerIteration) {
              const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
              currentRevealedChars[charIndex] = randomChar;
              // Update the full string to show fuzzy effect on current and subsequent unrevealed chars
              const tempFullDisplay = currentRevealedChars.map((c, i) => {
                if (i > charIndex && c === '\u00A0') { // Only fuzz unrevealed chars
                  return randomChars[Math.floor(Math.random() * randomChars.length)];
                }
                return c;
              }).join('');
              setDisplayedText(tempFullDisplay.slice(0, textToReveal.length)); // Ensure length matches

              fuzzyIteration++;
              animationFrameId = requestAnimationFrame(animateFuzzyChar);
            } else {
              cancelAnimationFrame(animationFrameId);
              currentRevealedChars[charIndex] = trueChar;
              setDisplayedText(currentRevealedChars.map(c => c === '\u00A0' && c !== ' ' ? '\u00A0' : c).join('')); // Ensure placeholders remain for unrevealed

              if (currentRevealedChars.every(c => c !== '\u00A0' || c === ' ')) {
                setDisplayedText(textToReveal); // Final correct text
                setIsRevealing(false);
              }
            }
          };
          animationFrameId = requestAnimationFrame(animateFuzzyChar);
          timeoutsRef.current.push(() => cancelAnimationFrame(animationFrameId)); // Add cleanup for this char's animation

        }, charIndex * charRevealInterval);
        timeoutsRef.current.push(charRevealTimeout); // Add char reveal timeout to cleanup array
      });
    }, revealDelay);
    timeoutsRef.current.push(mainStartTimeout); // Add main start timeout

    return () => {
      timeoutsRef.current.forEach(item => {
        if (typeof item === 'function') item(); // Cleanup animation frames
        else clearTimeout(item); // Cleanup timeouts
      });
      timeoutsRef.current = [];
      // Reset hasStartedRef if textToReveal might change and you want to re-trigger
      // hasStartedRef.current = false; // Be careful with this if textToReveal updates frequently
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textToReveal, revealDelay, charRevealInterval, fuzzyAnimDurationPerChar, maxFuzzyCharsPerIteration, randomChars]);
  // Removed isRevealing from deps

  return (
    <Component
      className={classNames('fuzzy-text-container', className, isRevealing && 'is-revealing')}
      aria-label={!isRevealing && textToReveal ? textToReveal : undefined}
      aria-live={isRevealing ? "polite" : "off"}
    >
      <span className="fuzzy-text-content" aria-hidden="true">
        {displayedText}
      </span>
      {/* Screen reader gets the final text immediately or when not revealing */}
      {!isRevealing && <span className="sr-only">{textToReveal}</span>}
    </Component>
  );
};

export default FuzzyText;