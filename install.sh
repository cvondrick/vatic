apt-get install -y python-setuptools

easy_install -U turkic

wget http://mit.edu/vondrick/code/pyvision.tar.gz
tar xzvf pyvision.tar.gz
cd pyvision-*
apt-get install -y python-dev
apt-get install -y libavcodec-dev libavformat-dev libswscale-dev
easy_install -U cython
easy_install -U numpy
python setup.py install
cd ..

apt-get install -y apache2

apt-get install -y mysql-server-5.1 mysql-client-5.1
apt-get install -y libmysqlclient-dev
easy_install -U mysql-python

turkic setup --public-symlink

echo "*****************************************************"
echo "*** Please consult README to finish installation. ***"
echo "*****************************************************"
