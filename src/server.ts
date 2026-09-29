import express from 'express';
import { PrismaClient } from '@prisma/client';

// Define a porta HTTP, cria a aplicação Express e prepara o acesso ao banco pelo Prisma.
const port = 3000;
const app = express();
const prisma = new PrismaClient();

// Permite que as rotas interpretem corpos de requisição enviados em JSON.
app.use(express.json());

// Lista os filmes em ordem alfabética e inclui os dados relacionados de gênero e idioma.
app.get('/movies', async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: 'asc',
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

// Cria um filme usando os campos enviados no corpo JSON da requisição.
app.post('/movies', async (req, res) => {
    const { title, genre_id, language_id, release_date, oscar_count } =
        req.body;

    // Converte a data recebida e grava o novo filme no banco.
    try {
        await prisma.movie.create({
            data: {
                title: title,
                genre_id: genre_id,
                language_id: language_id,
                release_date: new Date(release_date),
                oscar_count: oscar_count,
            },
        });
        // Retorna erro HTTP 500 caso a gravação falhe.
    } catch (error) {
        return res.status(500).send({ message: 'erro ao cadastrar um filme' });
    }

    // Informa que o recurso foi criado com sucesso.
    res.status(201).send();
});

// Inicia o servidor e registra no terminal a porta em que ele está ouvindo.
app.listen(port, () => {
    console.log(`Servidor em execução na porta:${port}`);
});
