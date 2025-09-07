// React + Live2D + GPT + TTS Starter Template

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const App = () => {
  const canvasRef = useRef(null);
  const [userInput, setUserInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Load Live2D model once
    const loadModel = async () => {
      const { Live2DModel } = await import("pixi-live2d-display");
      const app = new window.PIXI.Application({
        view: canvasRef.current,
        autoStart: true,
        transparent: true,
        width: 400,
        height: 600,
      });

      const model = await Live2DModel.from("/model/mao_pro_en/mao_pro.model3.json");
      model.scale.set(0.3);
      model.position.set(200, 400);
      app.stage.addChild(model);

      // Save to ref if needed later
      canvasRef.current.model = model;
    };
    loadModel();
  }, []);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `API_KEY_HERE`, // Replace with your OpenAI API key
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: userInput }],
      }),
    });

    const data = await res.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid GPT response:", data);
      alert("There was a problem getting a response from ChatGPT.");
      return;
    }

    console.log("GPT Response:", data);

    const gptText = data.choices[0].message.content;
    speakText(gptText);
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setIsSpeaking(true);
      startLipSync();
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      stopLipSync();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startLipSync = () => {
    const model = canvasRef.current?.model;
    if (!model) return;
    model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 1);
  };

  const stopLipSync = () => {
    const model = canvasRef.current?.model;
    if (!model) return;
    model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
  };

  return (
    <div className="p-4">
      <canvas ref={canvasRef} className="mb-4 border w-full h-[600px]" />
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 w-full"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-1 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById("root");
createRoot(container).render(<App />);

export default App;