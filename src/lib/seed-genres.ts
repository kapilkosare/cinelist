import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';
import 'dotenv/config';

const genresToSeed = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western"
];

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function seedGenres() {
  console.log('Starting to seed genres...');
  const genresCollectionRef = collection(db, 'genres');
  const batch = writeBatch(db);

  try {
    const existingGenresSnapshot = await getDocs(genresCollectionRef);
    const existingGenreNames = new Set(existingGenresSnapshot.docs.map(doc => doc.data().name));
    console.log('Existing genres:', Array.from(existingGenreNames));

    let genresAdded = 0;
    for (const genreName of genresToSeed) {
      if (!existingGenreNames.has(genreName)) {
        const newGenreRef = collection(db, 'genres').doc();
        batch.set(newGenreRef, { name: genreName, id: newGenreRef.id });
        console.log(`- Adding genre: ${genreName}`);
        genresAdded++;
      } else {
        console.log(`- Genre already exists: ${genreName}`);
      }
    }

    if (genresAdded > 0) {
      await batch.commit();
      console.log(`\nSuccessfully seeded ${genresAdded} new genres.`);
    } else {
      console.log('\nNo new genres to add. Database is up to date.');
    }

  } catch (error) {
    console.error('Error seeding genres:', error);
  } finally {
    // Firebase doesn't have a db.close() in the client SDK
    console.log('Genre seeding process finished.');
    // In a script, you might want to explicitly exit the process
    // For a simple script like this, it will exit automatically.
  }
}

seedGenres().then(() => {
    // In Node.js, you might need to force exit if there are open handles
    // but for client-side SDK usage in a script, it should typically exit.
    // If it hangs, you can use process.exit(0);
    setTimeout(() => process.exit(0), 1000); // give a second for writes to settle
});
