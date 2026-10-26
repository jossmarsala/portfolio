import React from "react";
import "./AboutSection.css";
import DecryptedText from "./DecryptedText";

const AboutSection: React.FC = () => {
  return (
    <section className="about-section" id="about">
      <div className="about-inner">
        {/* Quote */}
        <blockquote className="about-quote">
          I'm a software development student with 3+ years of experience
          across two fields:{" "}
          <DecryptedText
            text="design"
            parentClassName="about-keyword"
            encryptedClassName="about-keyword-enc"
            animateOn="inViewHover"
            speed={50}
            maxIterations={15}
            sequential={true}
          />{" "}
          and{" "}
          <DecryptedText
            text="code."
            parentClassName="about-keyword"
            encryptedClassName="about-keyword-enc"
            animateOn="inViewHover"
            speed={50}
            maxIterations={15}
            sequential={true}
          />{" "}
          <br /> I engineer systems and businesses that look and work{" "}
          <DecryptedText
            text="beautifully"
            parentClassName="about-keyword"
            encryptedClassName="about-keyword-enc"
            animateOn="inViewHover"
            speed={50}
            maxIterations={15}
            sequential={true}
            characters="abcdefghijklmnopqrstuvwxyz/&*!?()"
          />
          .
        </blockquote>
      </div>
    </section>
  );
};

export default AboutSection;
