#ifndef _HARMONICS_
#define _HARMONICS_

#include "common.h"

class Harmonics {

	private:
		void write_binary(const char* filename, const MatrixXd& matrix);
		int freqCount;
		const char* model;

	protected:
		bool mhbIsCalculated;	// true wenn MHB bereits berechnet wurde
		int vertCount;			// anzahl der vertices
		MatrixXd mhb;			// Manifold Harmonics Basis
		VectorXd eigenvalues;	// zu den vektor der MHB passende eigenvektoren
		VectorXd filter;		// filterfunktion, die auf hie harmonics angewendet wird

	public:
		Mesh* mesh;				// mesh-datenstruktor (aus OpenMesh)

		Harmonics(const char* modelname, int freq, int nf) {

			mhbIsCalculated = false;
			filter = VectorXd(freq);
			filter.fill(1);
			model = modelname;
			freqCount = nf;

		}

		/// MHB berechnen
		void calcMHB();
		void saveMHB();

		VPropHandleT<int> index;			// Vertex-Index
		VPropHandleT<float> voroRegion;		// Voronoi-Region der vertices

};

#endif