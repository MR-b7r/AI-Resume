import React, { use, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({ resume }: { resume: Resume }) => {
  const { auth, fs, kv } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadResume = async () => {
      const blob = await fs.read(resume.imagePath);
      if (!blob) return;
      let url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };

    loadResume();
  }, [resume.imagePath]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    const deleteEl = await kv.delete(`resume-${resume.id}`);
    console.log(deleteEl);
    await fs.delete(resume.imagePath);
    window.location.reload();
  };

  return (
    <Link
      to={`/resume/${resume.id}`}
      className="resume-card animate-in fade-in duration-1000"
    >
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          {resume.values.companyName && (
            <h2 className="!text-black font-bold break-words">
              {resume.values.companyName}
            </h2>
          )}
          {resume.values.jobTitle && (
            <h3 className="text-lg break-words text-gray-500">
              {resume.values.jobTitle}
            </h3>
          )}
          {!resume.companyName && !resume.values.jobTitle && (
            <h2 className="!text-black font-bold">Resume</h2>
          )}
        </div>

        <button
          className="z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow transition"
          onClick={handleDelete}
          title="Delete Resume"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-delete-icon lucide-delete"
          >
            <path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
            <path d="m12 9 6 6" />
            <path d="m18 9-6 6" />
          </svg>
        </button>

        {/* <div className="flex-shrink-0"></div> */}
      </div>

      {resumeUrl && (
        <div className="gradient-border animate-in fade-in duration-1000">
          <div className="w-full h-full">
            <img
              src={resumeUrl}
              alt="Resume"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;
