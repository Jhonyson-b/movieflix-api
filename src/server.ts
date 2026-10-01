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
        // Verifica no banco se já existe um filme com o nome que está sendo enviado.
        const movieWhitSameTitle = await prisma.movie.findFirst({
            where: {
                title: { equals: title, mode: 'insensitive' }, // Comparação insensível a maiúsculas/minúsculas
            },
        });
        if (movieWhitSameTitle) {
            return res
                .status(409)
                .send({ message: 'filme com o mesmo título já existe' });
        }

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

// Atualiza um filme existente pelo ID, usando os dados enviados no corpo JSON da requisição.
app.put('/movies/:id', async (req, res) => {
    // Pegar o id do registro que vai ser atualizado
    const id = Number(req.params.id); // Converte o ID recebido na URL para número

    // Verifica se o filme existe no banco antes de tentar atualizar
    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: id,
            },
        });
        if (!movie) {
            return res.status(404).send({ message: 'filme não encontrado' });
        }

        const data = { ...req.body }; // Cria uma cópia dos dados enviados no corpo da requisição
        data.release_date = data.release_date
            ? new Date(req.body.release_date)
            : undefined; // Converte a data de lançamento para objeto Date, se fornecida

        // Pegar os dados dos filmes que será atualizado e atualizar ele no prisma
        await prisma.movie.update({
            where: {
                id: id,
            },

            data: data,
        });
    } catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao atualizar o registro do filme' });
    }

    // Retornar o status correto informando que o filme foi atualizado
    res.status(200).send();
});

app.delete('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const movie = await prisma.movie.findUnique({ where: { id } });
        if (!movie) {
            return res.status(404).send({ message: 'filme não encontrado' });
        }

        await prisma.movie.delete({ where: { id } });
    } catch (error) {
        return res
            .status(500)
            .send({ message: 'Não foi possível remover o filme.' });
    }
    res.status(200).send();
});

app.get('/movies/:genreName', async (req, res) => {
    try {
        // Filtrar os filmes do banco pelo gênero
        const moviesFilteredByGenre = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: 'insensitive',
                    },
                },
            },
        });
        // Retornar os filmes filtrados na resposta da rota
        res.status(200).send(moviesFilteredByGenre);
    } catch (error) {
        res.status(500).send({
            message: 'Falha ao filtrar os filmes pelo gênero',
        });
    }
});

// Inicia o servidor e registra no terminal a porta em que ele está ouvindo.
app.listen(port, () => {
    console.log(`Servidor em execução na porta:${port}`);
});
