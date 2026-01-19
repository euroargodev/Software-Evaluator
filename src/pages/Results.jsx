// Results screen that renders evaluation summary, stats, and grouped criteria.
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import logo_1 from "../img/logo_euroargo_square.png"; 
import logo_2 from "../img/EAONE_2.png"; 
import "./Results.css";

function Results({ repository, evaluationResult, userAnswers, onGoBack }) {
  // Guard against direct navigation without data
  if (!evaluationResult || !repository) {
    return (
      <div className="results-container">
        <h2>No evaluation data available</h2>
        <button onClick={onGoBack} className="back-btn">
          Back
        </button>
      </div>
    );
  }

  // Safe destructuring with defaults
  const {
    validatedLevel = "Novice",
    achievedLevel = "Novice",
    globalScore = 0,
    details = {},
    stats = { metCriteria: 0, unmetCriteria: 0, totalCriteria: 0, targetLevel: null },
    feedback = []
  } = evaluationResult;

  const rateLimitErrors = Object.values(details || {}).filter(
    (item) => item?.error && /rate limit/i.test(item.error)
  );

  const scopeEntries = useMemo(() => {
    const scopes = {};
    if (details && typeof details === "object") {
      Object.entries(details).forEach(([id, criterion]) => {
        if (!criterion) return;
        const scope = criterion.group || "General";
        const level = criterion.level || "Unknown";
        if (!scopes[scope]) scopes[scope] = {};
        if (!scopes[scope][level]) scopes[scope][level] = [];
        scopes[scope][level].push({ id: Number(id), ...criterion });
      });
    }

    const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
    const scopeOrder = ["Argo specific", "General"];

    return Object.entries(scopes)
      .map(([scope, levels]) => {
        const levelEntries = Object.entries(levels)
          .map(([level, items]) => [
            level,
            items.sort((a, b) => (a.id || 0) - (b.id || 0)),
          ])
          .sort(
            (a, b) => levelOrder.indexOf(a[0]) - levelOrder.indexOf(b[0])
          );
        return [scope, levelEntries];
      })
      .sort(([a], [b]) => {
        const aIndex = scopeOrder.indexOf(a);
        const bIndex = scopeOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }, [details]);

  const [expandedCategories, setExpandedCategories] = useState({});
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [badgeCopyStatus, setBadgeCopyStatus] = useState("");

  useEffect(() => {
    setExpandedCategories((prev) => {
      const next = {};
      scopeEntries.forEach(([scope]) => {
        next[scope] = prev[scope] ?? false;
      });
      return next;
    });
  }, [scopeEntries]);

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const getBadgeDetails = (level) => {
    const badges = {
      Expert: {
        emoji: "🏆",
        color: "#FFD700",
        bgColor: "#FFF9E6",
        message: "Outstanding! Production-ready software",
        description: "Your project exemplifies software engineering excellence"
      },
      Advanced: {
        emoji: "🥇",
        color: "#C0C0C0",
        bgColor: "#F5F5F5",
        message: "Great work! Almost perfect",
        description: "Your project follows most best practices"
      },
      Intermediate: {
        emoji: "🥈",
        color: "#CD7F32",
        bgColor: "#FFF4E6",
        message: "Good foundation, keep improving",
        description: "You're on the right track"
      },
      Beginner: {
        emoji: "🥉",
        color: "#0a6b83",
        bgColor: "#e8f1f5",
        message: "On the right track",
        description: "Keep building on this foundation"
      },
      Novice: {
        emoji: "🌱",
        color: "#95A5A6",
        bgColor: "#F0F0F0",
        message: "Starting out, lots of potential",
        description: "Every expert was once a beginner"
      }
    };

    return badges[level] || badges.Novice;
  };

  const badge = getBadgeDetails(validatedLevel);
  const targetLevel = repository?.targetLevel || stats?.targetLevel;
  const autoCount = Number.isFinite(stats?.autoCriteria) ? stats.autoCriteria : null;
  const manualCount = Number.isFinite(stats?.manualCriteria) ? stats.manualCriteria : null;
  const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
  const scoreValue = Number.isFinite(globalScore) ? globalScore : 0;
  const scorePercent = Number.isFinite(globalScore)
    ? (globalScore * 100).toFixed(1)
    : "0.0";
  const progressTier =
    scoreValue >= 0.8 ? "high" : scoreValue >= 0.6 ? "mid" : "low";
  const scoreTier =
    globalScore >= 0.8 ? "high" : globalScore >= 0.6 ? "mid" : "low";
  const scoreNote =
    scoreTier === "high"
      ? "Great job - strong alignment with the selected scope."
      : scoreTier === "mid"
        ? "Good progress - a few key wins can lift your level."
        : "Solid start - focus on the most impactful criteria first.";
  const progressBadgeColor =
    progressTier === "high" ? "16a34a" : progressTier === "mid" ? "f59e0b" : "dc2626";

  const badgeLogoData =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJ5ZXMiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOTIyIiBoZWlnaHQ9IjExMDQiIHZpZXdCb3g9IjAgMCAxOTIyIDExMDQiPgo8cGF0aCBzdHlsZT0iZmlsbDojZmRjNjE1OyBzdHJva2U6bm9uZTsiIGQ9Ik04NDAgMTA3LjQzOUM4MjcuNDI4IDEwOS40MDMgODE1LjU5IDExNS4xMjcgODA3LjMyNiAxMjUuMDAxQzc5MC4zMjYgMTQ1LjMxIDc5MC4zMjUgMTgwLjY5MSA4MDcuMzI2IDIwMC45OTlDODE5Ljg3MiAyMTUuOTg3IDg0MS4xMzIgMjIxLjUwOCA4NjAgMjE4LjU2MUM4NzIuNDg3IDIxNi42MTEgODg0LjQ2MiAyMTAuODA5IDg5Mi42NzQgMjAwLjk5OUM5MDkuNjQ0IDE4MC43MjggOTA5LjU5NCAxNDUuMjc4IDg5Mi42NzQgMTI1Qzg4MC4wNTMgMTA5Ljg3MyA4NTkuMDI4IDEwNC40NjcgODQwIDEwNy40MzlNMTMxNiAyMDVMMTMxOCAyMTdMMTMzNyAyMTdMMTMzNyAxNTNMMTI4MyAxNTNMMTI4MyAxNzZMMTMxMCAxNzZDMTMwMy4zNSAxOTEuODc1IDEyODMuNTUgMTk3LjY1NyAxMjcwLjE3IDE4NS41MzJDMTI1OS40MSAxNzUuNzc1IDEyNTcuNjkgMTU2LjU0OCAxMjY2LjUzIDE0NS4wMDFDMTI2OS4zMyAxNDEuMzUxIDEyNzIuODUgMTM4LjE2NCAxMjc3IDEzNi4xMzlDMTI4Mi4xMyAxMzMuNjM1IDEyODcuNDIgMTMyLjk2MyAxMjkzIDEzMy45MjRDMTMwMS44NyAxMzUuNDUzIDEzMDcuMjIgMTQxLjQzNiAxMzE1IDE0NUMxMzE4LjM1IDEzOS45NDIgMTMyNi43NyAxMzAuMjc4IDEzMjYuNDEgMTI0LjAxNUMxMzI2LjIzIDEyMC45MTQgMTMyMy4yOSAxMTguODU0IDEzMjEgMTE3LjIwOUMxMzE1Ljg2IDExMy41MjQgMTMxMC4wMyAxMTAuODczIDEzMDQgMTA5LjAzOUMxMjc5LjY5IDEwMS42NTEgMTI1MS41NSAxMTAuOTIgMTIzOC40NSAxMzNDMTIyNy4yMyAxNTEuOTM1IDEyMjcuNiAxODEuMDE1IDEyNDAuNTkgMTk4Ljk5OUMxMjU4LjI4IDIyMy40NzEgMTI5NS4wNiAyMjUuNzY4IDEzMTYgMjA1TTE0MDYgMTA3LjQzOUMxMzkzLjQzIDEwOS40MDMgMTM4MS41OSAxMTUuMTI3IDEzNzMuMzMgMTI1LjAwMUMxMzU2LjI5IDE0NS4zNTYgMTM1Ni4yOSAxODAuNjQ0IDEzNzMuMzMgMjAwLjk5OUMxMzg1LjkzIDIxNi4wNTcgMTQwNy4wMyAyMjEuNTI1IDE0MjYgMjE4LjU2MUMxNDM3LjAyIDIxNi44NCAxNDQ4LjA1IDIxMi4wMzIgMTQ1NS45MSAyMDMuOTZDMTQ3NS4xNyAxODQuMTg2IDE0NzYuNSAxNDcuNTkyIDE0NTkuNDggMTI2QzE0NDcuMDMgMTEwLjE5OCAxNDI1LjM4IDEwNC40MTEgMTQwNiAxMDcuNDM5TTQ1NSAxMDlMNDU1IDIxN0w1MzUgMjE3TDUzNSAxOTBMNDgzIDE5MEw0ODMgMTc2TDUzMCAxNzZMNTMwIDE1MEw0ODMgMTUwTDQ4MyAxMzZMNTM0IDEzNkw1MzQgMTA5TDQ1NSAxMDlNNTYyIDEwOUw1NjIgMTYyQzU2MiAxNzQuODU3IDU2Mi4wOTggMTg5LjYxNyA1NjguOTMgMjAxQzU4NC41OTEgMjI3LjA5MiA2MzYuMjExIDIyNi4wMDkgNjUwLjM2NyAxOTlDNjU2LjU2NSAxODcuMTc0IDY1NiAxNzMuOTMxIDY1NiAxNjFMNjU2IDEwOUw2MjggMTA5TDYyOCAxNTRDNjI4IDE2Mi4xMTQgNjI5LjEgMTcxLjEyNyA2MjYuODI5IDE3OUM2MjMuNTQ3IDE5MC4zODMgNjA5LjIxOCAxOTYuMjU2IDU5OS4wMTUgMTg5LjI5N0M1OTAuNjA3IDE4My41NjIgNTkxIDE3NC4wMTQgNTkxIDE2NUw1OTEgMTA5TDU2MiAxMDlNNjg3IDEwOUw2ODcgMjE3TDcxNSAyMTdMNzE1IDE4OEM3MTguNzcxIDE4OCA3MjQuMzIgMTg2Ljk5OSA3MjcuNjcxIDE4OS4wMjhDNzM2Ljc1NiAxOTQuNTI3IDczNy40NCAyMTAuMzg2IDc0Ni4zNzkgMjE1Ljk3MkM3NDkuMjQ2IDIxNy43NjQgNzUzLjc3NiAyMTcgNzU3IDIxN0w3ODEgMjE3Qzc3OS4zMTMgMjExLjcxNCA3NzUuNzQ4IDIwNy41NTggNzcyLjY3IDIwM0M3NjcuMjIyIDE5NC45MzIgNzYxLjY2OSAxODYuOTE1IDc1NiAxNzlDNzc4LjMzOCAxNjcuNDA0IDc3Ni44OTIgMTMwLjI3IDc1NyAxMTcuMzg3QzczNy40OSAxMDQuNzUyIDcwOS4wODggMTA5IDY4NyAxMDlNOTkzIDIxN0wxMDE0IDIxN0MxMDE2LjYyIDIxNi45OTkgMTAyMC4yMiAyMTcuNTQ2IDEwMjIuNSAyMTUuOTcyQzEwMjguODkgMjExLjU2OSAxMDI1LjM2IDE5OC45MjUgMTAzNS4wMiAxOTguMDU5QzEwNDEuNTcgMTk3LjQ3IDEwNDguNDIgMTk3Ljk4NiAxMDU1IDE5OEMxMDU3Ljc5IDE5OC4wMDYgMTA2MS4yMyAxOTcuNjA3IDEwNjMuNDkgMTk5LjYwM0MxMDY3Ljk4IDIwMy41NzcgMTA2Ni44MSAyMTMuNjYgMTA3Mi40MiAyMTYuMzk3QzEwNzUuMDggMjE3LjY5MyAxMDc5LjEzIDIxNyAxMDgyIDIxN0wxMTAzIDIxN0MxMTAxLjcxIDIwOC40MDMgMTA5Ny4yMSAyMDAuMDM5IDEwOTQgMTkyQzEwODcuODcgMTc2LjY2NyAxMDgxLjY5IDE2MS4zNSAxMDc1LjYgMTQ2QzEwNzIuNDMgMTM4LjAxNCAxMDY5LjM5IDEyOS45NzkgMTA2Ni4yIDEyMkMxMDY0LjgzIDExOC41ODcgMTA2My43OSAxMTQuMjkyIDEwNjEuNTkgMTExLjMxOEMxMDU4LjM3IDEwNi45ODIgMTA0Ny44IDEwOC45NjggMTA0MyAxMDkuMDAxQzEwNDAuODYgMTA5LjAxNiAxMDM4LjMgMTA4Ljc4NSAxMDM2LjQyIDExMC4wMjhDMTAzMy45MyAxMTEuNjczIDEwMzMuMDQgMTE1LjM4OCAxMDMyIDExOEMxMDI5LjM1IDEyNC42NDYgMTAyNi44NiAxMzEuMzU0IDEwMjQuMiAxMzhDMTAxMy43MyAxNjQuMTgyIDEwMDIuMDQgMTkwLjI5MiA5OTMgMjE3TTExMjIgMTA5TDExMjIgMjE3TDExNTEgMjE3TDExNTEgMTg4QzExNTQuNzIgMTg4IDExNjAuMzMgMTg2Ljk3NiAxMTYzLjYyIDE4OS4wMjhDMTE3Mi42NCAxOTQuNjU0IDExNzMuMjEgMjEwLjQ1MyAxMTgyLjMzIDIxNS45NzJDMTE4NS4yNSAyMTcuNzQyIDExODkuNzMgMjE3IDExOTMgMjE3TDEyMTcgMjE3QzEyMTMuNTggMjA3Ljk4OCAxMjA2LjQzIDE5OS44MTcgMTIwMC44NiAxOTJDMTE5OC41OSAxODguODE0IDExOTQuOTQgMTg1LjAwOSAxMTkzLjg4IDE4MS4xODRDMTE5Mi44MyAxNzcuNDQgMTE5OS44MSAxNzIuODgzIDEyMDEuNzggMTY5Ljk5OUMxMjA2LjU2IDE2My4wMDQgMTIwOC4xOSAxNTQuMzI5IDEyMDcuOTkgMTQ2QzEyMDcuOSAxNDIuMjk0IDEyMDcuMzIgMTM4LjU0OCAxMjA2LjIzIDEzNUMxMTk3LjQgMTA2LjQxNSAxMTYxLjczIDEwOSAxMTM4IDEwOUwxMTIyIDEwOXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I2ZmZmZmZjsgc3Ryb2tlOm5vbmU7IiBkPSJNODQ2IDEzMy40NjhDODEzLjEzNiAxMzkuNjU1IDgyMC40MzcgMTk4LjA1MSA4NTUgMTkxLjUzMkM4ODcuNDA3IDE4NS40MjEgODgwLjI4NyAxMjcuMDEyIDg0NiAxMzMuNDY4TTE0MTIgMTMzLjQ2OEMxMzc5LjExIDEzOS42NjEgMTM4Ni4zNiAxOTguMDY1IDE0MjEgMTkxLjUzMkMxNDUzLjMzIDE4NS40MzQgMTQ0Ni4zIDEyNy4wMDkgMTQxMiAxMzMuNDY4TTcxNSAxMzRMNzE1IDE2NEM3MjEuNTM4IDE2NCA3MjguOTg3IDE2NC42NjYgNzM0Ljk5NiAxNjEuNTQ3Qzc0NC4xMTcgMTU2LjgxMiA3NDUuNTY3IDE0My43NzIgNzM2Ljk1NiAxMzcuNzAzQzczMC45OSAxMzMuNDk4IDcyMS45NDggMTM0IDcxNSAxMzRNMTE1MSAxMzRMMTE1MSAxNjRDMTE1Ny41NCAxNjQgMTE2NC45OSAxNjQuNjY3IDExNzEgMTYxLjU0N0MxMTc5Ljc2IDE1Ni45OTkgMTE4MS4yNiAxNDMuNTYzIDExNzIuOTYgMTM3LjcwM0MxMTY3IDEzMy40OTUgMTE1Ny45NCAxMzQgMTE1MSAxMzRNMTA0NyAxNDdDMTA0My45OCAxNTYuMjc2IDEwNDAuMiAxNjUuNDkzIDEwMzggMTc1TDEwNTYgMTc1QzEwNTMuOTkgMTY2LjIxOSAxMDUxLjggMTU0LjYzMSAxMDQ3IDE0N3oiLz4KPHBhdGggc3R5bGU9ImZpbGw6I2ZkYzYxNTsgc3Ryb2tlOm5vbmU7IiBkPSJNOTI4IDE2NEw5MjggMTg3TDk3NyAxODdMOTc3IDE2NEw5MjggMTY0eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojMDA3MTlmOyBzdHJva2U6bm9uZTsiIGQ9Ik04NjIgNDgwQzg1MC42NDkgNDgzLjM0IDgzOS4zMzIgNDkzLjg4NyA4MzEgNTAyLjAxNUM4MTEuOTQgNTIwLjYwNiA3OTYuMTAxIDU0MS4zOTUgNzg1LjU3OSA1NjZDNzgyLjUzNCA1NzMuMTIgNzc4LjM4NSA1ODEuMjE4IDc3Ny41NTUgNTg5Qzc3Ny4wNzEgNTkzLjUzOSA3NzguODM2IDU5OC41MjkgNzc5LjU4NiA2MDNDNzgwLjk3OSA2MTEuMzAyIDc4Mi4wMzMgNjE5LjYyOCA3ODIuODMgNjI4Qzc4NC41MTQgNjQ1LjY4NyA3ODIuNzE3IDY2NC41ODIgNzc5LjU3NiA2ODJDNzYzLjExMyA3NzMuMjc5IDY5My41ODEgODQ3LjU5MSA2MDQgODcxLjExNkM1NzUuODQgODc4LjUxMSA1NDUuODExIDg4MC4wMjYgNTE3IDg3Ni4yODJDNDg3LjY5MiA4NzIuNDczIDQ2MC4wOTIgODYyLjk5NSA0MzQgODQ5LjIxOUM0MTEuMTUgODM3LjE1NSAzODkuOTk3IDgyMC4yMjEgMzcyLjgzNCA4MDFDMzU0LjE3MyA3ODAuMTAxIDMzOC43NjcgNzU2Ljk0MiAzMjguMDEyIDczMUMyODkuMTQ1IDYzNy4yNTkgMzE3LjQxNyA1MjkuNTcyIDM5MyA0NjMuMTU1QzQxOC44MTYgNDQwLjQ3IDQ0OS45OTMgNDIzLjg0NiA0ODMgNDE0LjQyN0M1MTUuMzEgNDA1LjIwNyA1NDkuODc1IDQwMi44NzggNTgzIDQwOC40MzVDNTk4LjQ0NyA0MTEuMDI3IDYxMi44NTMgNDE2LjQ5NiA2MjggNDIwQzY0Mi4xMzYgMzk0LjYzNCA2NjQuMzggMzcyLjEzIDY4NSAzNTIuMDE1QzY5My4yNSAzNDMuOTY3IDcwNC4yNzQgMzM3LjM1MiA3MTEgMzI4QzY3My4xMzQgMzA4LjA4IDYyOS43OTMgMjkzLjc0OCA1ODcgMjkwQzUxOC40NTggMjgzLjk5NyA0NTEuMjgzIDI5My45MDMgMzg5IDMyNC4yNTlDMzY1LjgzNyAzMzUuNTQ5IDM0NC4wNzYgMzUwLjExNiAzMjQgMzY2LjJDMjEwLjg4OCA0NTYuODIyIDE2Ni4yMjYgNjExLjQ0IDIwOC45NzUgNzQ5QzIyMi4xNzMgNzkxLjQ2OSAyNDMuNzc1IDgzMS42NjEgMjcyLjA4NCA4NjZDMzAxLjQzNSA5MDEuNjAzIDMzNy4zNTMgOTMxLjcwNiAzNzggOTUzLjY5MUM0NzAuMDQ0IDEwMDMuNDggNTgxLjkgMTAwOS4yNiA2NzkgOTcwLjc5NkM3MTguMjU0IDk1NS4yNDYgNzUzLjM2NSA5MzIuMDM1IDc4NSA5MDQuMjg1QzgxNC4zNDQgODc4LjU0NSA4MzkuMTM1IDg0Ni4zMDYgODU3LjY5MSA4MTJDODk4LjM2NiA3MzYuODAyIDkxMS4wMTYgNjQ4LjQ5MSA4OTIuNTc2IDU2NUM4ODUuOTQ5IDUzNC45OTcgODczLjcxNSA1MDguMTM4IDg2MiA0ODB6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNmZGM2MTU7IHN0cm9rZTpub25lOyIgZD0iTTYwNiA4MjJDNjE3LjgwNSA4MjAuMjU2IDYyOS43NDkgODEzLjY5OCA2NDAgODA3Ljg1QzY2Ny4yNjQgNzkyLjI5NCA2OTAuNzUzIDc3MC43MjQgNzA3LjQyNCA3NDRDNzEzLjUzNSA3MzQuMjAzIDcyMS4zMjIgNzIyLjQ5NSA3MjMuNjIxIDcxMUM3MjUuOTMgNjk5LjQ1NSA3MjQgNjg1Ljc2NyA3MjQgNjc0QzcyNCA2NDYuMjc2IDcyMy40MDMgNjE5LjI3MyA3MjkuMjExIDU5MkM3NTEuODQ5IDQ4NS42OTggODUxLjMyNSA0MDUuMTc5IDk2MCA0MDUuMTc5QzEwNjguMSA0MDUuMTc5IDExNjguMiA0ODQuOTI3IDExOTAuNzkgNTkxQzExOTYuNDMgNjE3LjUwNSAxMTk3IDY0NC4wMDYgMTE5NyA2NzFDMTE5NyA2ODQuMzMxIDExOTQuNzYgNjk5LjkyNyAxMTk3LjM4IDcxM0MxMTk5LjY3IDcyNC40NjcgMTIwNy44NyA3MzYuMjgzIDEyMTQuMDUgNzQ2QzEyMzAuNzIgNzcyLjE3OSAxMjU0LjE1IDc5My4wMDggMTI4MSA4MDguMjgxQzEyOTAuOTYgODEzLjk0NCAxMzAyLjU0IDgyMC4zMDggMTMxNCA4MjJMMTMxNCA2OTlDMTMxNCA2NjguODIxIDEzMTUuNjkgNjM4LjAzOCAxMzEyLjgzIDYwOEMxMzA4LjI2IDU1OS45NzQgMTI5My42MiA1MTMuMzkzIDEyNzAuNjkgNDcxQzEyNTMuMDggNDM4LjQ0MyAxMjI5LjY3IDQwOS40MjUgMTIwMyAzODMuOTYxQzEwODAuNDcgMjY2Ljk5MSA4ODMuMTg3IDI1Ni40ODMgNzQ4IDM1Ny44NzNDNzIwLjQ5NSAzNzguNTAyIDY5NS40MzcgNDAzLjE5NCA2NzUuMTUxIDQzMUM2NDAuNTk1IDQ3OC4zNjcgNjE4LjAxNiA1MzIuOTc1IDYwOS40MjcgNTkxQzYwNC43MjggNjIyLjc1MSA2MDYgNjU0Ljk3OSA2MDYgNjg3TDYwNiA4MjJ6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiMwMDcxOWY7IHN0cm9rZTpub25lOyIgZD0iTTEyMDkgMzI4QzEyMTQuNzcgMzM1Ljg0MiAxMjIzLjg4IDM0MS40NTggMTIzMSAzNDguMDg5QzEyNDUgMzYxLjEzMiAxMjU4LjI3IDM3NS4xOTQgMTI3MC4zOSAzOTBDMTI3NS42OSAzOTYuNDc4IDEyODAuNzEgNDAzLjE5MyAxMjg1LjU4IDQxMEMxMjg3LjU2IDQxMi43NzIgMTI4OS43OSA0MTcuMzg0IDEyOTMuMTcgNDE4LjY0N0MxMjk2LjE4IDQxOS43NjggMTMwMC4xNSA0MTcuNTc4IDEzMDMgNDE2LjcyQzEzMTAuMjggNDE0LjUyOSAxMzE3LjYgNDEyLjU4MyAxMzI1IDQxMC44ODFDMTM0Ni42MSA0MDUuOTEzIDEzNjguOTggNDA0LjU4MiAxMzkxIDQwNi4wODlDMTQ5MS42OCA0MTIuOTg0IDE1NzQuOTIgNDg3LjU3OSAxNjAyIDU4M0wxNDkwIDU4M0wxNDM0IDU4M0MxNDIwLjAzIDU4MyAxNDA1Ljg4IDU4Mi4zNzEgMTM5MyA1ODguODFDMTM1NC4wMSA2MDguMzAzIDEzNDguNzEgNjY2LjUxIDEzODYgNjkwLjg5OUMxNDA4LjcgNzA1Ljc0NiAxNDM5LjIyIDcwMSAxNDY1IDcwMUwxNjM1IDcwMUMxNjYxLjcxIDcwMSAxNjkxLjU1IDcwNC40NjkgMTcxMS43MSA2ODIuOTExQzE3MzAuNTkgNjYyLjcyMSAxNzI4LjcxIDYzNS40NTggMTcyNi4xNyA2MTBDMTcyMC4xMiA1NDkuNDY1IDE3MDAuNDIgNDg5Ljg1MSAxNjY0Ljg2IDQ0MEMxNjQyLjkyIDQwOS4yNDEgMTYxNy4yOSAzODEuNjE2IDE1ODcgMzU4Ljg5NUMxNTEzLjg3IDMwNC4wNDUgMTQyMC43NCAyNzguOTk0IDEzMzAgMjkwLjI4NUMxMzAzLjE4IDI5My42MjIgMTI3Ni4zMSAyOTkuODgxIDEyNTEgMzA5LjQyNUMxMjM2LjYgMzE0Ljg1NiAxMjIzLjE1IDMyMi4xMDggMTIwOSAzMjhNMTA1OCA0ODBDMTA1MS4zMyA0OTYuMDM1IDEwNDMuNjIgNTExLjUxNSAxMDM4IDUyOEMxMDI2LjA5IDU2Mi45NzEgMTAxOS45MiA2MDAuMTQxIDEwMTkuMDEgNjM3QzEwMTYuNzQgNzMwLjAxNCAxMDU1LjI3IDgyMy42MzYgMTEyMC4wMSA4OTBDMTE1Ni42MyA5MjcuNTI4IDEyMDIuMDUgOTU2LjExNSAxMjUxIDk3NC41NzVDMTI4NC45NiA5ODcuMzgxIDEzMjAuOTYgOTkzLjQ0MyAxMzU3IDk5NS45MTFDMTM4OC42OCA5OTguMDggMTQyMS4yNCA5OTYgMTQ1MyA5OTZMMTU1NCA5OTZDMTU3MC44OCA5OTYgMTU4OC4xNyA5OTcuMDkgMTYwNSA5OTUuOTExQzE2NTMuMTEgOTkyLjUzOCAxNjc1LjQyIDkzMS45NTcgMTY0My4yNSA4OTcuMTdDMTYyNS40MyA4NzcuOTExIDE2MDIuMzEgODc4IDE1NzggODc4TDE0OTAgODc4TDE0MDEgODc4QzEzNzkuOTMgODc4IDEzNTguODggODc4LjgxNCAxMzM4IDg3NS41NzZDMTI4MS4zOSA4NjYuNzk2IDEyMjkuMjEgODM2LjgyOSAxMTkyLjQ0IDc5M0MxMTU4LjkyIDc1My4wNTEgMTE0MC42MyA3MDMuNzM3IDExMzcuMDkgNjUyQzExMzYuMTYgNjM4LjM5NiAxMTM3LjQ3IDYyNC40NjggMTEzOS4yOCA2MTFDMTE0MC4xOSA2MDQuMjgyIDExNDMuMDUgNTk2Ljc0MiAxMTQyLjczIDU5MEMxMTQyLjQ3IDU4NC43MTMgMTEzOS43NSA1NzguOTI5IDExMzcuOTUgNTc0QzExMjcuNTEgNTQ1LjUzMSAxMTA5LjI4IDUyMC4zMTcgMTA4NyA1MDBDMTA3OS4xNSA0OTIuODQxIDEwNjguNTcgNDgyLjQ4NCAxMDU4IDQ4MHoiLz4KPC9zdmc+Cg==";
  const makeShieldUrl = (label, message, color, options = {}) => {
    const params = new URLSearchParams({
      style: "flat",
      ...(options.logo ? { logo: options.logo } : {}),
      ...(options.logoWidth ? { logoWidth: String(options.logoWidth) } : {}),
      ...(options.labelColor ? { labelColor: options.labelColor } : {})
    });
    return `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}?${params.toString()}`;
  };

  const progressLabel = targetLevel ? `Target ${targetLevel}` : "Progress";
  const progressBadgeUrl = makeShieldUrl(
    progressLabel,
    `${scorePercent}% complete`,
    progressBadgeColor,
    {
      logo: badgeLogoData,
      logoWidth: 14
    }
  );
  const badgeMarkdown = `![${progressLabel}: ${scorePercent}% complete](${progressBadgeUrl})`;

  const nextWins = Object.values(details || {})
    .filter((criterion) => criterion?.status === "unmet")
    .sort((a, b) => {
      const levelDelta =
        levelOrder.indexOf(a.level || "Novice") - levelOrder.indexOf(b.level || "Novice");
      if (levelDelta !== 0) return levelDelta;
      return (a.id || 0) - (b.id || 0);
    })
    .slice(0, 3);

  const handleCopyBadges = async () => {
    try {
      await navigator.clipboard.writeText(badgeMarkdown);
      setBadgeCopyStatus("Badge snippet copied.");
      setTimeout(() => setBadgeCopyStatus(""), 2500);
    } catch (error) {
      console.error("Failed to copy badge snippet:", error);
      setBadgeCopyStatus("Copy failed. Use the image URL instead.");
      setTimeout(() => setBadgeCopyStatus(""), 3000);
    }
  };

  const downloadBadge = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download badge:", error);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = () => {
    const evaluationFile = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        tool: "EuroArgo Software Evaluator"
      },
      repository: {
        owner: repository.owner,
        repo: repository.repo,
        url: repository.url || `https://github.com/${repository.owner}/${repository.repo}`
      },
      evaluation: {
        level: validatedLevel,
        achievedLevel,
        score: globalScore,
        stats: stats,
        evaluatedAt: new Date().toISOString()
      },
      details: details,
      userAnswers: userAnswers || {},
      feedback: feedback || []
    };

    const blob = new Blob([JSON.stringify(evaluationFile, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${repository.owner}_${repository.repo}_evaluation_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ Evaluation file downloaded");
  };

  return (
    <div className="results-page">
      {/* Header with Euro-Argo branding */}
      <header className="results-header">
        <div className="header-title">
          <img src={logo_1} alt="Euro-Argo Logo" className="header-logo" />
          <h1>Evaluation Results</h1>
        </div>
        <p className="repo-name">
          {repository.owner}/{repository.repo}
        </p>
      </header>

      {/* Main content */}
      <main className="results-container max-w-5xl mx-auto p-6">
        {rateLimitErrors.length > 0 && (
          <div className="rate-limit-banner">
            Some automatic checks could not run due to GitHub API rate limits. Try again later.
          </div>
        )}
        {/* Badge */}
        <div
          className="badge-card p-8 rounded-2xl shadow-lg mb-8 text-center"
          style={{
            backgroundColor: badge.bgColor,
            borderLeft: `6px solid ${badge.color}`
          }}
        >
          <div className="text-6xl mb-4">{badge.emoji}</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: badge.color }}>
            {validatedLevel} Level
          </h2>
          <div className="text-5xl font-bold mb-2 text-gray-800">
            {(globalScore * 100).toFixed(1)}%
          </div>
          <p className={`score-note ${scoreTier}`}>
            {scoreNote} You met {stats.metCriteria} of {stats.totalCriteria} criteria.
          </p>
          <div className="score-explain">
            <button
              type="button"
              className="score-explain-btn"
              onClick={() => setShowScoreDetails((prev) => !prev)}
              aria-expanded={showScoreDetails}
            >
              Understand my score
              <span className="score-explain-icon">{showScoreDetails ? "-" : "+"}</span>
            </button>
            {showScoreDetails && (
              <div className="score-explain-panel">
                <p>
                  The score reflects the share of criteria met within the evaluated scope
                  {autoCount !== null && manualCount !== null
                    ? ` (${stats.totalCriteria} criteria: ${autoCount} auto, ${manualCount} manual).`
                    : ` (${stats.totalCriteria} criteria).`}
                </p>
                <ul>
                  <li>The scope depends on the chosen target level.</li>
                  <li>
                    The displayed level is capped by the target level (if you choose "Beginner",
                    you cannot reach "Intermediate").
                  </li>
                  <li>Higher-level criteria carry more weight in the final score.</li>
                  <li>Auto checks can fail if GitHub rate limits the API.</li>
                </ul>
              </div>
            )}
          </div>
          <p className="text-xl text-gray-700 mb-2">{badge.message}</p>
          <p className="text-gray-600 italic">{badge.description}</p>
          <div className="badge-chips">
            <span className={`badge-pill badge-progress ${progressTier}`}>
              {progressLabel}: {scorePercent}% complete
            </span>
          </div>
          <div className="badge-downloads">
            <div className="badge-downloads-header">
              <span>Badge for your README</span>
              <span className="badge-downloads-note">Copy or download as SVG</span>
            </div>
            <div className="badge-preview">
              <img src={progressBadgeUrl} alt={`${progressLabel} ${scorePercent}% complete`} />
            </div>
            <div className="badge-actions">
              <button type="button" className="btn-tertiary" onClick={handleCopyBadges}>
                Copy Markdown
              </button>
              <button
                type="button"
                className="btn-tertiary"
                onClick={() =>
                  downloadBadge(
                    progressBadgeUrl,
                    `${repository.owner}_${repository.repo}_progress_badge.svg`
                  )
                }
              >
                Download Badge
              </button>
            </div>
            {badgeCopyStatus && (
              <div className="badge-copy-status">{badgeCopyStatus}</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="stat-card bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <div className="text-3xl font-bold text-green-600">
              {stats.metCriteria}
            </div>
            <div className="text-gray-600">Criteria Met</div>
          </div>
          <div className="stat-card bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <div className="text-3xl font-bold text-red-600">
              {stats.unmetCriteria}
            </div>
            <div className="text-gray-600">To Improve</div>
          </div>
          <div className="stat-card bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalCriteria}
            </div>
            <div className="text-gray-600">Total Criteria</div>
          </div>
        </div>

        <section className="next-wins">
          <div className="next-wins-header">
            <h3>Next wins</h3>
            <span className="next-wins-subtitle">Quick improvements with the biggest impact</span>
          </div>
          {nextWins.length > 0 ? (
            <ul className="next-wins-list">
              {nextWins.map((criterion) => (
                <li key={criterion.id} className="next-wins-item">
                  <span className="next-wins-title">{criterion.title}</span>
                  <span className="next-wins-meta">
                    {criterion.type === "auto" ? "Auto" : "Manual"} · {criterion.level}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="next-wins-empty">
              All criteria are met. Great job!
            </div>
          )}
        </section>

      <section className="criteria-section">
        <h2 className="section-title">See which criteria are met</h2>
        <div className="criteria-grid">
        {scopeEntries.map(([scope, levelEntries]) => {
          const flatItems = levelEntries.flatMap(([, items]) => items);
          const metCount = flatItems.filter((criterion) => criterion.status === "met").length;
          const unmetCount = flatItems.length - metCount;
          const scopeTone =
            metCount > unmetCount ? "positive" : metCount < unmetCount ? "negative" : "neutral";

          const progress = flatItems.length > 0 ? Math.round((metCount / flatItems.length) * 100) : 0;
          return (
          <div key={scope} className="category-group">
            <button
              type="button"
              className={`category-header ${scopeTone} ${expandedCategories[scope] ? "open" : ""}`}
              onClick={() => toggleCategory(scope)}
            >
              <div className="category-title">
                <span>{scope}</span>
                <span className="category-count">
                  {metCount}/{flatItems.length} met
                </span>
                <div className={`category-progress ${scopeTone}`} aria-hidden="true">
                  <div
                    className="category-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="toggle-icon" aria-hidden="true">
                {expandedCategories[scope] ? "−" : "+"}
              </span>
            </button>
            {expandedCategories[scope] && (
              <div className="level-groups">
                {levelEntries.map(([level, items]) => {
                  const levelMet = items.filter((criterion) => criterion.status === "met").length;
                  const levelUnmet = items.length - levelMet;
                  const levelTone =
                    levelMet > levelUnmet ? "positive" : levelMet < levelUnmet ? "negative" : "neutral";
                  return (
                    <div key={`${scope}-${level}`} className={`level-group ${levelTone}`}>
                      <div className="level-header">
                        <span className="level-title">{level}</span>
                        <span className="level-count">{levelMet}/{items.length} met</span>
                      </div>
                      <div className="criteria-list">
                        {items.map((criterion) => (
                          <div
                            key={criterion.id}
                            className={`criteria-item ${criterion.status === "met" ? "met" : "unmet"}`}
                          >
                            <span
                              className={`status-indicator ${
                                criterion.status === "met" ? "validated" : "missing"
                              }`}
                            >
                              {criterion.status === "met" ? "Validated" : "Missing"}
                            </span>
                            <div className="criteria-text">
                              <span className="criterion-title">{criterion.title}</span>
                              {criterion.evidence && criterion.evidence.length > 0 && (
                                <span className="criteria-evidence">
                                  Evidence: {Array.isArray(criterion.evidence) ? criterion.evidence.join(", ") : criterion.evidence}
                                </span>
                              )}
                            </div>
                            <span className="criteria-meta">
                              {criterion.type === "auto" ? "Auto" : "Manual"} · {criterion.level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
        })}
        </div>
      </section>

      {/* BUTTONS */}
      <div className="action-buttons">
        <button onClick={handleDownload} className="btn-primary">
          Download Evaluation Report
        </button>
        <button onClick={onGoBack} className="btn-secondary">
          Return to Form
        </button>
      </div>

        {/* PRO TIP */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Pro Tip:</strong> Save this evaluation file! You can upload it on your next visit 
            to skip answering manual questions again. We'll only re-run the automatic tests.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="results-footer">
        <div className="footer-funding">
          <p className="footer-project">
            This repository is developed within the framework of the Euro-Argo ONE project.
          </p>
          <p className="footer-grant">
            This project has received funding from the European Union's Horizon 2020 research and innovation programme under project no <strong>101188133</strong>.
          </p>
          <p className="footer-call">
            Call <em>HORIZON-INFRA-2024-DEV-03</em>: Developing, consolidating and optimising the European research infrastructures landscape, maintaining global leadership.
          </p>
        </div>

        <img src={logo_2} alt="Euro-Argo Logo" className="footer-logo" />
        
        <div className="footer-links">
          <a href="https://www.euro-argo.eu" target="_blank" rel="noopener noreferrer">
            Euro-Argo Website
          </a>
          <span>|</span>
          <a href="https://github.com/euroargodev" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}

Results.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    repo: PropTypes.string.isRequired,
    url: PropTypes.string,
  }).isRequired,
  evaluationResult: PropTypes.shape({
    validatedLevel: PropTypes.string,
    globalScore: PropTypes.number,
    details: PropTypes.object,
    feedback: PropTypes.array,
    stats: PropTypes.object,
  }),
  userAnswers: PropTypes.object,
  onGoBack: PropTypes.func.isRequired,
};

Results.defaultProps = {
  evaluationResult: null,
  userAnswers: {},
};

export default Results;
