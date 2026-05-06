import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SvivvaAd from "@/components/SvivvaAd";

import Home from "@/pages/Home";
import ChatPage from "@/pages/Chat";
import SummarizerPage from "@/pages/Summarizer";
import TranslatorPage from "@/pages/Translator";
import CodeExplainerPage from "@/pages/CodeExplainer";
import GrammarPage from "@/pages/Grammar";
import SentimentPage from "@/pages/Sentiment";
import KeywordsPage from "@/pages/Keywords";
import ToneRewriterPage from "@/pages/ToneRewriter";
import ImageGenPage from "@/pages/ImageGen";
import QuizPage from "@/pages/Quiz";
import ToolPage from "@/pages/ToolPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/ai-chat" component={ChatPage} />
      <Route path="/summarize" component={SummarizerPage} />
      <Route path="/text-summarizer" component={SummarizerPage} />
      <Route path="/translate" component={TranslatorPage} />
      <Route path="/ai-translator" component={TranslatorPage} />
      <Route path="/code-explain" component={CodeExplainerPage} />
      <Route path="/code-explainer" component={CodeExplainerPage} />
      <Route path="/grammar" component={GrammarPage} />
      <Route path="/grammar-checker" component={GrammarPage} />
      <Route path="/sentiment" component={SentimentPage} />
      <Route path="/sentiment-analyzer" component={SentimentPage} />
      <Route path="/keywords" component={KeywordsPage} />
      <Route path="/keyword-extractor" component={KeywordsPage} />
      <Route path="/tone-rewrite" component={ToneRewriterPage} />
      <Route path="/tone-rewriter" component={ToneRewriterPage} />
      <Route path="/image-gen" component={ImageGenPage} />
      <Route path="/image-generator" component={ImageGenPage} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/quiz-generator" component={QuizPage} />
      <Route path="/:slug" component={ToolPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div style={{ paddingBottom: "90px" }}>
            <Router />
          </div>
        </WouterRouter>
        <SvivvaAd />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
