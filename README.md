# Luminary

Luminary is an AI-powered journal chatbot that provides PDF preview, annotation, citation generation, and contextual academic insights. It integrates seamlessly with Redis for real-time annotation syncing and offers advanced document interactions, setting it apart from general-purpose chatbots like ChatGPT.

## Features

- 📄 **PDF Preview and Annotation** - View, annotate, and save changes to your PDFs in real-time.
- 📚 **Citation Generator** - Quickly generate formatted citations in various styles.
- 🤖 **AI-Powered Chat** - Ask questions about relevant papers and get concise, context-aware responses.
- 📝 **Smart Note-Taking** - Highlight text, add comments, and organize your research.

## Installation

1. Clone the repository:

```bash
$ git clone https://github.com/Rafli-Dewanto/chatbot-journal.git luminary
$ cd luminary
```

2. Install dependencies:

```bash
$ pnpm install
```

3. Set up environment variables in `.env`:

```
NODE_ENV=
AUTH_SECRET=
XAI_API_KEY=
OPENAI_API_KEY=
BLOB_READ_WRITE_TOKEN=
POSTGRES_URL=
REDIS_URL=
NEXT_PUBLIC_UPSTASH_REDIS_REST_URL=
NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN=
```

4. Build the application:

```bash
$ pnpm run build
```

5. Start the server:

```bash
$ pnpm start
```

## Development

Run the app in development mode:

```bash
$ pnpm dev
```

## Docker

To build and run the app with Docker:

```bash
$ docker build -t luminary .
$ docker run -p 3000:3000 luminary
```

## Roadmap

- ✅ PDF preview and annotation
- ✅ Citation generator
- ✅ AI-powered paper insights
- 🚧 Research graph and note management
- 🚧 Collaborative annotations

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
