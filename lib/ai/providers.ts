import { openai } from '@ai-sdk/openai';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import { google } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': google('gemini-2.5-pro-preview-05-06'),
        'chat-model-reasoning': wrapLanguageModel({
          model: google('gemini-2.5-pro-preview-05-06'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': google('gemini-2.5-pro-preview-05-06'),
        'artifact-model': google('gemini-2.5-pro-preview-05-06'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });
