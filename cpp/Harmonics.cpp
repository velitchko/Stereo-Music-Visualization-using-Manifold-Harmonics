#include "Harmonics.h"

void Harmonics::calcMHB()
{
	cout << "Calculating MHB ";

	mesh->add_property(index,"index");
	mesh->add_property(voroRegion, "voroRegion");

	// Allen vertices indizes zuordnen (durchnummerieren)
	int idx=0;

	Mesh::VertexIter vertexIterator = mesh->vertices_begin();
	for(vertexIterator; vertexIterator != mesh->vertices_end(); ++vertexIterator) {

		mesh->property(index,vertexIterator) = idx;
		++idx;

	}

	vertCount = mesh->n_vertices();
	cout << "for " << vertCount << " vertices... ";

	
	// Voronoi-Region hinzufuegen
	vertexIterator = mesh->vertices_begin();
	for(vertexIterator; vertexIterator != mesh->vertices_end(); ++vertexIterator) {

		float currentArea = 0;

		float* currentData = mesh->point(vertexIterator).data();						// aktuelle vertex-position
		Vector3f currentPoint(currentData[0],currentData[1],currentData[2]);

		bool isLastNeighbor = false;

		Mesh::VertexVertexIter neighborIterator = mesh->vv_begin(vertexIterator);		// -1 ring-nachbarschaft iterator
		int neighborNo = 0;			// abbruchbedingung

		for( ; ; )	{
			
			// break if last neighbor is reached
			if (neighborIterator == mesh->vv_end(vertexIterator) && neighborNo > 0) {
				break;
			}

			float* lastData = mesh->point(neighborIterator).data();						// current neighbor's position
			Vector3f lastPoint(lastData[0], lastData[1], lastData[2]);

			++neighborIterator;								// immer den naechten nachbarn nehmen, ausser am schluss (da wieder den ersten)
			neighborNo++; 

			float* nextData = mesh->point(neighborIterator).data();						// next neighbor's position
			Vector3f nextPoint(nextData[0],nextData[1],nextData[2]);

			// Zentrum der edges und face area berechnen
			Vector3f lastCenter		= (currentPoint+lastPoint)/2;
			Vector3f nextCenter		= (currentPoint+nextPoint)/2;
			Vector3f facecenter		= (currentPoint+lastPoint+nextPoint)/3;

			// laengen berechnen
			float	lastLength		= (currentPoint-lastCenter).norm();
			float	nextLength		= (currentPoint-nextCenter).norm();
			float	currentFace		= (currentPoint-facecenter).norm();
			float	lastFace		= (lastCenter-facecenter).norm();
			float	nextFace		= (nextCenter-facecenter).norm();

			// in diesem dreieck die Voronoi-Region berechnen:
			//		area = sqrt(s*(s-a)*(s-b)*(s-c))
			//		s = circumference/2
			float firsts		= (lastLength + lastFace + currentFace)/2;
			float seconds		= (nextLength + nextFace + currentFace)/2;
			float firstArea		= sqrt(firsts*(firsts-lastLength)*(firsts-lastFace)*(firsts-currentFace));
			float secondArea	= sqrt(seconds*(seconds-nextLength)*(seconds-nextFace)*(seconds-currentFace));
			float triangleArea	= firstArea + secondArea;

			currentArea += triangleArea;

		}

		mesh->property(voroRegion, vertexIterator) = currentArea;

	}

	// dreiecks-operator berechnen
	MatrixXd* tri = new MatrixXd(vertCount, vertCount);

	tri->setZero();

	// ueber alle vertices iterieren und deren coefficients berechen
	vertexIterator = mesh->vertices_begin();

	// fuer alle vertices
	for(vertexIterator; vertexIterator != mesh->vertices_end(); ++vertexIterator) {
		float diagonalSum = 0;		// summe der diagonal-eintraege

		int i = mesh->property(index,vertexIterator);				// index des vertex
		float firstArea = mesh->property(voroRegion,vertexIterator);	// region des vertex

		bool isLastNeighbor = false;		// abbruchbedingung

		float* currentData = mesh->point(vertexIterator).data();				// aktuelle vertex-position
		Vector3f currentPoint(currentData[0], currentData[1], currentData[2]);

		//for all its neighbors 
		Mesh::VertexVertexIter neighborIterator = mesh->vv_begin(vertexIterator); 

		// fuer alle nachbarn
		int neighborNo=0;
		for( ; ; ) {
			// break if last neighbor is reached
			if(neighborIterator == mesh->vv_end(vertexIterator) && neighborNo > 0)
			{
				break;
			}

			int j = mesh->property(index, neighborIterator);				// index des nachbarn
			float secondArea = mesh->property(voroRegion, neighborIterator);	// region des nachbarn

			float* data = mesh->point(neighborIterator).data();
			Vector3f currentneighbor(data[0], data[1], data[2]);

			Vector3f nextNeighbor;
			Vector3f lastNeighbor;

			// at first neighbor, use the last one as previous
			// at last neighbor, use the first one as next
			if(neighborIterator == mesh->vv_begin(vertexIterator))
			{
				++neighborIterator;
				float* nextData = mesh->point(neighborIterator).data();
				nextNeighbor = Vector3f(nextData[0], nextData[1], nextData[2]);

				float* prevdata = mesh->point(--mesh->vv_end(vertexIterator)).data();
				lastNeighbor = Vector3f(prevdata[0], prevdata[1], prevdata[2]);

			}
			else
			{
				--neighborIterator;
				float* prevdata = mesh->point(neighborIterator).data();
				lastNeighbor=Vector3f(prevdata[0], prevdata[1], prevdata[2]);

				++neighborIterator;
				++neighborIterator;
				float* nextData = mesh->point(neighborIterator).data();
				nextNeighbor=Vector3f(nextData[0], nextData[1], nextData[2]);
			}



			// Winkeln berechnen

			// Fall 1
			Vector3f lastCur		= (currentneighbor  - lastNeighbor ).normalized();
			Vector3f lastCent		= (currentPoint  - lastNeighbor ).normalized();
			float firstAngle		= acos(lastCur.dot(lastCent));

			// Fall 2
			Vector3f nextCur		= (currentneighbor  - nextNeighbor ).normalized();
			Vector3f nextCent		= (currentPoint  - nextNeighbor ).normalized();
			float secondAngle		= acos(nextCur.dot(nextCent));

			float firstCot			= 1/tan(firstAngle);
			float secondCot			= 1 / tan(secondAngle);



			float coefficient		= (-1) * (firstCot + secondCot) / sqrt(firstArea*secondArea);

			// bei fehlerhaften meshes, coefficients 0 setzen
			int cl = _fpclass(coefficient);
			if(!(cl==_FPCLASS_NN || cl==_FPCLASS_PN))
			{
				coefficient = 0;
			}

			
			tri->operator()(i,j) = coefficient;
			diagonalSum += coefficient;


			neighborNo++;
			
		}

		tri->operator()(i,i) = (-1)*diagonalSum;

	}	

	EigenSolver<MatrixXd> *solver = new EigenSolver<MatrixXd>(*tri,true);

	// eigenvector geringsten eigenwerten finden

	mhb = MatrixXd(vertCount, vertCount);
	eigenvalues = VectorXd(vertCount);

	MatrixXd eigVecsTmp = solver->eigenvectors().real();
	VectorXd eigValsTmp = solver->eigenvalues().real();
	vector<bool> taken(vertCount, false);

	for (int i = 0; i < vertCount; i++) {

		double smallestAbs = 3.40282e+038;	// 2x das maximum
		int smallestIdx = 0;

		for (int j = 0; j < vertCount; j++) {

			if(!taken.at(j)) {

				if(abs(eigValsTmp(j))<smallestAbs) {
					smallestAbs = abs(eigValsTmp(j));
					smallestIdx = j;
				}

			}

		}

		mhb.col(i) = eigVecsTmp.col(smallestIdx);
		eigenvalues(i) = eigValsTmp(smallestIdx);
		taken.at(smallestIdx) = true;

	}

	delete solver;
	delete tri;

	mhbIsCalculated = true;
	cout << "ok." << endl;

}


void Harmonics::write_binary(const char* filename, const MatrixXd& matrix)
{
	
	ofstream out(filename,ios::out | ios::binary | ios::trunc);
	out.precision(4);
	MatrixXd::Index rows=matrix.rows(), cols=matrix.cols();

	out.write((char*) matrix.data(), rows*cols*sizeof(MatrixXd));

	out.close();

}

void Harmonics::saveMHB()
{
	if (mhbIsCalculated) {

		cout << endl;


		// BINARY-OUTPUT
		mhb.conservativeResize(vertCount, freqCount);
		mhb.transposeInPlace();
		
		const char* extBin = ".mhb";
		string output_file_binary = model;
		output_file_binary += extBin;
		
		cout << "Writing " + output_file_binary + " (binary) to disk... ";
		write_binary(output_file_binary.c_str(), mhb);
		cout << "done!" << endl;

		
		// TEXT-OUTPUT
		const char* extTx = "_mhb.txt";
		string output_file_text = model;
		output_file_text += extTx;

		ofstream _mhb;
		_mhb.open(output_file_text);
		_mhb.precision(4);
		cout << "Writing " + output_file_text + " (text) to disk... ";
		_mhb<<mhb;
		_mhb.close();
		cout << "done!" << endl;
		

		cout << endl;
		
	}
}