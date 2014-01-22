from fabric.api import *

env.hosts = ['amc@amc.pori.tut.fi:2202']

def test():
    run("uname -a")


def deploy():
	# update git repository
	with cd ('/home/amc/github-repos/magical'):
		run ('git pull')

	""" Could not get this to work yet
	# run database migrations
	with cd ('/home/amc/http-magos/django'), prefix('source /home/amc/.venvs/magos/bin/activate'):
		run ('django-admin.py migrate')
	"""

	# restart services
	sudo ('restart http-magos-django', shell=False)
	sudo ('restart http-magos-editor-lite', shell=False)
	sudo ('restart http-magos-editor', shell=False)

