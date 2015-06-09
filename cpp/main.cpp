#ifndef _MHB_APP_
#define _MHB_APP_

#include "Harmonics.h"

const int numFrequencies = 50;
const int frequencies = 1024;

int main(int argc, char *argv[])
{
	bool error = false;

	// Name des OBJ-Modells (OHNE FILE-EXTENSON!)
	string name = "ship";

	string filename = string(name);
	Harmonics *harmonics = new Harmonics(name.c_str(), frequencies, numFrequencies);	// eigentliche Berechnung der manifold harmonics
	Mesh mesh_;

	const char* _filename = filename.append(".obj").c_str();
	IO::Options opt;
	opt += IO::Options::VertexNormal;
	opt += IO::Options::FaceNormal;

	mesh_.request_face_normals();
	mesh_.request_vertex_normals();

	cout << "Loading file '" << _filename << "'..." << endl;
	
	// auf moegliche fehler pruefen
	if (!error && !IO::read_mesh(mesh_, _filename, opt)) {
		cout << endl;
		cout << "ERROR: Unable to access file " << _filename << "... Exiting!" << endl;
		error = true;
	}

	if (!error && mesh_.n_vertices() < 64)	{
		cout << "WARNING: Vertex count too low!" << endl;
	}

	if(!error && mesh_.n_vertices() > 1000) {
		cout << "WARNING: Vertex count too high!" << endl;
	}

	if (!error && mesh_.n_vertices() < numFrequencies) {
		cout << "WARNING: Number of frequencies higher than vertex count!" << endl;
	}

	cout << endl;

	// error handling
	if (error) {
		system("pause");
		exit(1);
	}
	

	// vertex faces und normals updaten
	if (!opt.check(IO::Options::FaceNormal)) {

		mesh_.update_face_normals();

	} else {

		cout << "Face normals found... " << endl;

	}
	
	if (!opt.check(IO::Options::VertexNormal)) {

		mesh_.update_vertex_normals();

	} else {

		cout << "Vertex normals found... " << endl;

	}

	harmonics->mesh = &mesh_;
	harmonics->calcMHB();
	harmonics->saveMHB();

	system("pause");

}

#endif