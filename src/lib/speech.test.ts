import { speak, stopSpeaking } from './speech';

describe('speech', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cancels anything in progress and speaks the text', () => {
    const synth = { cancel: vi.fn(), speak: vi.fn() };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        rate = 1;
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    );
    speak('Contact');
    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Contact' }));
    stopSpeaking();
    expect(synth.cancel).toHaveBeenCalledTimes(2);
  });

  it('does nothing where speech is unsupported or throws', () => {
    expect(() => {
      speak('Contact');
    }).not.toThrow();
    vi.stubGlobal('speechSynthesis', {
      cancel: () => {
        throw new Error('blocked');
      },
    });
    expect(() => {
      speak('Contact');
      stopSpeaking();
    }).not.toThrow();
  });
});
