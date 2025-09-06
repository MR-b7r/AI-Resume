import React, { useState, type FormEvent } from "react";
import { redirect } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { formElements, prepareInstructions } from "~/constants";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    values,
    file,
  }: {
    values: Record<string, string>;
    file: File;
  }) => {
    setIsProcessing(true);

    setStatusText("Uploading your resume...");
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText("Error: Failed to upload file");

    setStatusText("Converting to image...");
    const imageFile = await convertPdfToImage(file);
    console.log(imageFile);
    if (!imageFile.file)
      return setStatusText("Error: Failed to convert PDF to image");

    setStatusText("Uploading the image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error: Failed to upload image");

    setStatusText("Preparing data...");
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      values,
      feedback: "",
    };
    await kv.set(`resume-${uuid}`, JSON.stringify(data));

    setStatusText("Analyzing your resume...");
    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({
        jobTitle: values.jobTitle,
        jobDescription: values.jobDescription,
      })
    );
    if (!feedback) return setStatusText("Error: Failed to analyze resume");
    console.log(feedback);

    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume-${uuid}`, JSON.stringify(data));

    setStatusText("Analysis complete, redirecting...");
    console.log(data);
    // redirect(`/resume/${uuid}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const values: Record<string, string> = {};
    formElements.forEach((element) => {
      values[element.camelCase] = formData.get(element.name)?.toString() || "";
    });

    if (!file) return;

    handleAnalyze({ values, file });
  };
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              className="flex flex-col gap-4 mt-8"
              onSubmit={handleSubmit}
            >
              {formElements.map((element) => (
                <div className="form-div" key={element.name}>
                  <label htmlFor={element.name}>{element.label}</label>
                  <input
                    type="text"
                    name={element.name}
                    placeholder={element.label}
                    id={element.name}
                  />
                </div>
              ))}

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>
              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
